"""
Test suite for the ReportViewSet API.

Covers:
- Listing and filtering reports
- Ordering and pagination
- Custom actions for related tasks and parts
- Business logic such as invoice generation on report export
"""

from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from rest_framework import status
from api.models import Report, Vehicle, Owner, TaskTemplate, Task, Inventory, Part, Invoice
from django.contrib.auth import get_user_model

User = get_user_model()

class ReportViewSetTest(APITestCase):
    """
    Integration tests for the ReportViewSet endpoints.

    Includes tests for standard list/retrieve/update behavior, custom filters,
    ordering, pagination, and side effects like invoice creation.
    """

    def setUp(self):
        """
        Set up initial data for testing:
        - Authenticated user
        - Two vehicles and associated reports
        - One task and one part for one of the reports
        """
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        
        self.owner = Owner.objects.create(full_name="John Doe")
        v1 = Vehicle.objects.create(owner=self.owner, brand='Audi', model='A3', year=2010, license_plate='XYZ1')
        v2 = Vehicle.objects.create(owner=self.owner, brand='BMW', model='X5', year=2005, license_plate='XYZ2')
        self.report1 = Report.objects.create(vehicle=v1, user=self.user, status='pending')
        self.report2 = Report.objects.create(vehicle=v2, user=self.user, status='pending')

        self.task_template = TaskTemplate.objects.create(name="Oil Change", description="Change engine oil", price=50)
        self.task = Task.objects.create(report=self.report1, task_template=self.task_template)

        self.inventory = Inventory.objects.create(name="Oil Filter", quantity_in_stock=20, unit_price=15)
        self.part = Part.objects.create(report=self.report1, part=self.inventory, quantity_used=1)

    def test_list_reports(self):
        """
        Test that all reports are listed correctly.
        """
        url = reverse('report-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_filter_by_status(self):
        """
        Test filtering reports by status query parameter.
        """
        self.report1.status = "completed"
        self.report1.save()
        url = reverse('report-list') + '?status=completed'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_ordering(self):
        """
        Test ordering reports by vehicle brand.
        """
        url = reverse('report-list')
        response = self.client.get(url + '?ordering=vehicle__brand')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        vehicle_ids = [r['vehicle'] for r in response.data]
        vehicles = Vehicle.objects.in_bulk(vehicle_ids)
        brands = [vehicles[vid].brand for vid in vehicle_ids]
        self.assertEqual(brands, sorted(brands))

    def test_pagination(self):
        """
        Test paginated response using limit and offset query parameters.
        """
        url = reverse('report-list') + '?limit=1&offset=0'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)

    def test_update_triggers_invoice(self):
        """
        Test that updating a report's status to 'exported' creates an invoice.
        """
        url = reverse('report-detail', kwargs={'pk': self.report1.pk})
        data = {'status': 'exported'}  # This should trigger invoice creation
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice = Invoice.objects.get(report=self.report1)
        self.assertTrue(invoice.pdf.name.endswith('.pdf'))
        self.assertGreater(invoice.total_cost, 0)
        
    def test_get_tasks_for_report(self):
        """
        Test custom action to retrieve tasks associated with a report.
        """
        url = reverse('report-tasks', kwargs={'pk': self.report1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['task_template'], self.task_template.id)

    def test_get_parts_for_report(self):
        """
        Test custom action to retrieve parts associated with a report.
        """
        url = reverse('report-parts', kwargs={'pk': self.report1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['part'], self.inventory.id)