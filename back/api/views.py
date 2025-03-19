from rest_framework import permissions, status, viewsets, filters
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.template.loader import get_template
from django.core.files.base import ContentFile
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

class CustomPagination(LimitOffsetPagination):
    default_limit = 5

# Authentication Views
class RegisterView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
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
    """Retrieve the list of users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = []
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Returns the currently logged-in user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only retrieve the authenticated user's profile
        return UserProfile.objects.filter(user=self.request.user)

# Owners Views
class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    serializer_class = OwnerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['full_name', 'email']
    ordering_fields = ['full_name']

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
    # queryset = Report.objects.all()
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
        html_content, final_total = self.generate_invoice_pdf(invoice)
        
        # Update the invoice with the calculated total_cost
        invoice.total_cost = final_total
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

        return html_content, final_total
    
    
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
    queryset = TaskTemplate.objects.all()
    serializer_class = TaskTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # To set up filters from the backend side
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['name', 'description']
    ordering_fields = ['name']

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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

class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.all()
    serializer_class = PartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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

