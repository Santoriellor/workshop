"""
Characterization tests for the inventory, task-template and invoice endpoints.

Inventory and Invoice each set `pagination_class = None` and hand-roll
pagination in `list()`: they return a bare array unless the caller sends
`limit` or `offset`, in which case they switch to `CustomPagination`
(`LimitOffsetPagination` with `default_limit = 5`) and return the envelope
`{count, next, previous, results}`. Task 12 collapses those two copies into
one mixin; these tests are what proves the collapse changed nothing.

TaskTemplate has no `list()` override and no `pagination_class` of its own,
so it falls through to the project-wide `DEFAULT_PAGINATION_CLASS`
(`LimitOffsetPagination` with no `PAGE_SIZE` configured in settings) rather
than sharing Inventory/Invoice's hand-rolled branch — its envelope trigger
semantics differ and are deliberately left unpinned here, because Task 12's
plan only touches the Report/Inventory/Invoice `list()` overrides and never
touches `TaskTemplateViewSet`.
"""

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import (
    Inventory,
    Invoice,
    Owner,
    Part,
    Report,
    Task,
    TaskTemplate,
    Vehicle,
)
from api.tests.helpers import authenticate, make_user


class InventoryEndpointTests(APITestCase):
    def setUp(self):
        authenticate(self.client, make_user(email="e@example.com", username="e"))
        for index in range(7):
            Inventory.objects.create(
                name=f"Item {index}",
                reference_code=f"REF-{index}",
                category="filters",
                quantity_in_stock=Decimal("10.00"),
                unit_price=Decimal("5.00"),
            )

    def test_list_returns_a_bare_array_by_default(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 7)

    def test_list_is_ordered_by_name_by_default(self):
        response = self.client.get(reverse("inventory-list"))
        names = [row["name"] for row in response.data]
        self.assertEqual(names, sorted(names))

    def test_limit_switches_the_response_to_the_pagination_envelope(self):
        response = self.client.get(reverse("inventory-list") + "?limit=3")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data.keys()), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 7)
        self.assertEqual(len(response.data["results"]), 3)

    def test_offset_alone_uses_the_five_item_default_page(self):
        response = self.client.get(reverse("inventory-list") + "?offset=0")
        self.assertEqual(len(response.data["results"]), 5)

    def test_rows_carry_the_formatted_timestamps(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertIn("formatted_created_at", response.data[0])
        self.assertIn("formatted_updated_at", response.data[0])

    def test_creating_an_item_returns_201(self):
        response = self.client.post(
            reverse("inventory-list"),
            {
                "name": "Brake pad",
                "reference_code": "REF-BP",
                "category": "brakes",
                "quantity_in_stock": "4.00",
                "unit_price": "40.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_a_duplicate_reference_code_is_rejected(self):
        response = self.client.post(
            reverse("inventory-list"),
            {
                "name": "Clash",
                "reference_code": "REF-0",
                "quantity_in_stock": "1.00",
                "unit_price": "1.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TaskTemplateEndpointTests(APITestCase):
    def setUp(self):
        authenticate(self.client, make_user(email="e@example.com", username="e"))
        TaskTemplate.objects.create(name="Brakes", description="Replace pads", price=200)
        TaskTemplate.objects.create(name="Alignment", description="Four wheel", price=90)

    def test_list_returns_a_bare_array(self):
        response = self.client.get(reverse("task-template-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_filtering_by_name_narrows_the_list(self):
        response = self.client.get(reverse("task-template-list") + "?name=Brakes")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Brakes")

    def test_ordering_by_name_is_supported(self):
        response = self.client.get(reverse("task-template-list") + "?ordering=name")
        self.assertEqual([row["name"] for row in response.data], ["Alignment", "Brakes"])

    def test_creating_a_template_returns_201(self):
        response = self.client.post(
            reverse("task-template-list"),
            {"name": "Tyres", "description": "Swap set", "price": "320.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class InvoiceEndpointTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="e@example.com", username="e")
        authenticate(self.client, self.user)

        owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        vehicle = Vehicle.objects.create(
            owner=owner, brand="Audi", model="A3", year=2015, license_plate="INV-1"
        )
        self.report = Report.objects.create(vehicle=vehicle, user=self.user, status="completed")
        template = TaskTemplate.objects.create(name="Oil change", price=Decimal("50.00"))
        Task.objects.create(report=self.report, task_template=template)
        item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=Decimal("20.00"),
            unit_price=Decimal("15.00"),
        )
        Part.objects.create(report=self.report, part=item, quantity_used=Decimal("2.00"))
        # Created directly rather than by exporting the report: this test is
        # about the read contract, and rendering the PDF is slow and already
        # covered by test_reportviewset.test_update_triggers_invoice.
        self.invoice = Invoice.objects.create(invoice_number="INV-000001", report=self.report)

    def test_list_returns_a_bare_array(self):
        response = self.client.get(reverse("invoice-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

    def test_a_row_carries_the_derived_customer_fields(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertEqual(row["owner_full_name"], "Ada Lovelace")
        self.assertEqual(row["vehicle_plate"], "INV-1")

    def test_total_cost_is_computed_from_tasks_and_parts(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        # one task at 50.00 plus two parts at 15.00 each, with no VAT
        self.assertEqual(Decimal(str(row["total_cost"])), Decimal("80.00"))

    def test_pdf_exists_is_false_when_no_file_was_written(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertFalse(row["pdf_exists"])

    def test_filtering_by_invoice_number_narrows_the_list(self):
        response = self.client.get(reverse("invoice-list") + "?invoice_number=INV-000001")
        self.assertEqual(len(response.data), 1)

    def test_limit_switches_the_response_to_the_pagination_envelope(self):
        response = self.client.get(reverse("invoice-list") + "?limit=1")
        self.assertEqual(set(response.data.keys()), {"count", "next", "previous", "results"})
        self.assertEqual(response.data["count"], 1)
