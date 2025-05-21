"""
views.py

This module defines all API views for the Django backend.
It includes endpoints for user authentication, user profiles, owners, vehicles, reports, tasks,
inventory, and invoices.
The views use Django REST Framework's class-based viewsets and custom APIViews to provide standard CRUD operations and custom logic such as:
- User registration and login with JWT token support
- Concurrency control via `updated_at` checks on updates
- Report export and dynamic PDF invoice generation using WeasyPrint
- Filtering and ordering via DjangoFilterBackend
- Custom pagination where needed using LimitOffsetPagination

Each view enforces appropriate permissions, typically requiring authentication, and is designed
to interact with corresponding serializers and models for structured input/output handling.
"""

from rest_framework import permissions, status, viewsets, filters
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.template.loader import get_template
from django.core.files.base import ContentFile
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_aware, make_aware
from django.db.models import Value, F, CharField
from django.db.models.functions import Concat
from weasyprint import HTML
from decimal import Decimal
from .models import (
    User, UserProfile,
    Owner, Vehicle,
    Report, Task, TaskTemplate,
    Part, Inventory, Invoice
)
from .serializers import (
    LoginSerializer, UserSerializer, UserProfileSerializer,
    OwnerSerializer, VehicleSerializer,
    ReportSerializer, TaskSerializer, TaskTemplateSerializer,
    InventorySerializer, PartSerializer, InvoiceSerializer
) 
from .filters import OwnerFilter

class CustomPagination(LimitOffsetPagination):
    default_limit = 5

# Authentication Views
class RegisterView(APIView):
    """
    API endpoint that allows a new user to register.

    Accepts a POST request with user data, validates it using the UserSerializer,
    and creates a new user upon successful validation.
    """
    permission_classes = []
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    API endpoint that allows a user to log in.

    Validates credentials and returns JWT access and refresh tokens upon success,
    along with serialized user data.
    """
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to retrieve user data.

    Provides a read-only view of all users and includes custom actions to return
    the currently authenticated user's info and check username/email availability.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Returns the currently logged-in user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"])
    def check_availability(self, request):
        username = request.query_params.get("username")
        email = request.query_params.get("email")

        response_data = {}
        if username is not None:
            response_data["username_taken"] = User.objects.filter(username=username).exists()
        if email is not None:
            response_data["email_taken"] = User.objects.filter(email=email).exists()

        return Response(response_data)

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing the authenticated user's profile.

    Supports CRUD operations, but restricts access to only the requesting user's profile.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only retrieve the authenticated user's profile
        return UserProfile.objects.filter(user=self.request.user)

# Owners Views
class OwnerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing vehicle owners.

    Supports CRUD operations with filtering and ordering based on name and email.
    Includes concurrency checks during updates using `updated_at`.
    """
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = OwnerFilter

    def get_queryset(self):
        queryset = Owner.objects.all()
        ordering = self.request.query_params.get('ordering')

        if ordering in ['full_name', '-full_name']:
            direction = '' if ordering == 'full_name' else '-'
            queryset = queryset.annotate(
                _full_name=Concat(
                    F('first_name'), Value(' '), F('last_name'),
                    output_field=CharField()
                )
            ).order_by(f'{direction}_full_name')

        return queryset
    
    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
                
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

# Vehicles Views
class VehicleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing vehicles.

    Supports full CRUD operations with filtering and ordering on various fields.
    Includes concurrency conflict resolution during updates.
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['brand', 'model', 'year', 'license_plate', 'owner']
    ordering_fields = ['brand', 'model']

    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
                
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

# Reports Views
class ReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing maintenance reports.

    Includes logic for pagination, filtering, ordering, and concurrency control.
    Features a custom invoice generation method when a report is marked as 'exported',
    including PDF generation using WeasyPrint. Also exposes related tasks and parts.
    """
    queryset = Report.objects.select_related('vehicle').all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # disable Pagination
    pagination_class = None
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact', 'in'],
        'vehicle__brand': ['exact'],
        'vehicle__owner': ['exact'],
    }
    ordering_fields = ['vehicle__brand', 'vehicle__model', 'created_at', 'updated_at', 'status']
    
    def list(self, request, *args, **kwargs):
        limit = request.query_params.get("limit")
        offset = request.query_params.get("offset")
        ordering = request.query_params.get("ordering", "vehicle__brand,vehicle__model")

        queryset = self.filter_queryset(self.get_queryset()).order_by(*ordering.split(","))
        
        if limit or offset:
            self.pagination_class = CustomPagination
            paginator = self.pagination_class()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(self.get_serializer(paginated_queryset, many=True).data)
        
        # If no pagination params are set, return all results
        return Response(self.get_serializer(queryset, many=True).data)
    
    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Get the current status before updating
        previous_status = instance.status
    
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            
            # Check if status changed to "exported"
            if previous_status != "exported" and serializer.validated_data.get("status") == "exported":
                self.generate_invoice(instance, request)
                
            return Response(serializer.data)

        return Response(serializer.errors, status=400)
    
    def generate_invoice(self, report, request):
        """Create an invoice and generate a PDF for an exported report."""
        invoice_number = f"INV-{report.id:06d}"
        
        # Create an Invoice entry
        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            report=report
        )
        
        # Generate invoice PDF and calculate the total cost with VAT
        html_content = self.generate_invoice_pdf(invoice)
        
        invoice.save()    

        pdf_file = HTML(string=html_content, base_url=request.build_absolute_uri()).write_pdf()
        
        # Save the PDF to the invoice model
        invoice.pdf.save(f"invoices/invoice_{invoice_number}.pdf", ContentFile(pdf_file), save=True)

        return Response({"message": "Invoice generated successfully", "invoice_id": invoice.id})
    
    def generate_invoice_pdf(self, invoice):
        """Generate and return a PDF file for the invoice."""
        tasks = Task.objects.filter(report=invoice.report)
        parts = Part.objects.filter(report=invoice.report)
        # Join task with task template and part with inventory
        tasks = tasks.select_related('task_template')
        parts = parts.select_related('part')
        
        VAT_RATE = Decimal("0.2")
        task_data = []
        part_data = []
        net_total = Decimal("0.00")
        
        # Process tasks
        for task in tasks:
            price = task.task_template.price
            vat_amount = price * VAT_RATE
            total_price = price + vat_amount
            
            task_data.append({
                "name": task.task_template.name,
                "price": "{:.2f}".format(price),
                "vat": "{:.2f}".format(vat_amount),
                "total": "{:.2f}".format(total_price),
            })
            
            net_total += price 
            
        # Process parts
        for part in parts:
            unit_price = part.part.unit_price
            quantity = part.quantity_used
            subtotal = unit_price * quantity
            vat_amount = subtotal * VAT_RATE
            total_price = subtotal + vat_amount
            
            part_data.append({
                "name": part.part.name,
                "unit_price": "{:.2f}".format(unit_price),
                "quantity": str(quantity),
                "subtotal": "{:.2f}".format(subtotal),
                "vat": "{:.2f}".format(vat_amount),
                "total": "{:.2f}".format(total_price),
            })

            net_total += subtotal
            
        vat_total = net_total * VAT_RATE
        final_total = net_total + vat_total
        template = get_template("api/invoice_template.html")
        context = {
        "invoice": invoice,
        "tasks": task_data,
        "parts": part_data,
        "net_total": "{:.2f}".format(net_total),
            "vat_total": "{:.2f}".format(vat_total),
            "final_total": "{:.2f}".format(final_total),
        }
        html_content = template.render(context)

        return html_content
    
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """ Get tasks related to a report """
        report = self.get_object()
        tasks = report.task_set.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def parts(self, request, pk=None):
        """ Get parts related to a report """
        report = self.get_object()
        parts = report.part_set.all()
        serializer = PartSerializer(parts, many=True)
        return Response(serializer.data)

class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing task templates.

    Allows full CRUD operations and supports filtering and ordering by name or description.
    """
    queryset = TaskTemplate.objects.all()
    serializer_class = TaskTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['name', 'description']
    ordering_fields = ['name']
    
    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

class InventoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing inventory items.

    Provides CRUD functionality, with filtering and ordering on inventory fields.
    Pagination is disabled unless limit/offset parameters are specified.
    """
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # disable Pagination
    pagination_class = None
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['name', 'reference_code', 'category', 'updated_at']
    ordering_fields = ['name']
    
    def list(self, request, *args, **kwargs):
        limit = request.query_params.get("limit")
        offset = request.query_params.get("offset")
        ordering = request.query_params.get("ordering", "name")

        queryset = self.filter_queryset(self.get_queryset()).order_by(*ordering.split(","))
        
        if limit or offset:
            self.pagination_class = CustomPagination
            paginator = self.pagination_class()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(self.get_serializer(paginated_queryset, many=True).data)
        
        # If no pagination params are set, return all results
        return Response(self.get_serializer(queryset, many=True).data)
    
    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
           
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing invoices.

    Allows listing and updating invoices with ordering and filtering support.
    Pagination is disabled unless explicitly requested via query parameters.
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # disable Pagination
    pagination_class = None
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['invoice_number']
    ordering_fields = ['issued_date']

    def list(self, request, *args, **kwargs):
        limit = request.query_params.get("limit")
        offset = request.query_params.get("offset")
        ordering = request.query_params.get("ordering", "issued_date")

        queryset = self.filter_queryset(self.get_queryset()).order_by(*ordering.split(","))
        
        if limit or offset:
            self.pagination_class = CustomPagination
            paginator = self.pagination_class()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(self.get_serializer(paginated_queryset, many=True).data)
        
        # If no pagination params are set, return all results
        return Response(self.get_serializer(queryset, many=True).data)
    
    def update(self, request, *args, **kwargs):
        """Allow partial updates while keeping existing values for missing fields."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

