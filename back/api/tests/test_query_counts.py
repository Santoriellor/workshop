"""
Query-count tests for the two list endpoints that serialize related objects.

These assert a property rather than a number: listing N rows must cost the same
number of queries as listing one. An absolute count would have to be retuned
whenever a field is added; this formulation only fails when eager loading is
actually lost.
"""

from decimal import Decimal

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
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


class ListQueryCountTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="e@example.com", username="e")
        authenticate(self.client, self.user)

        self.owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        self.template = TaskTemplate.objects.create(
            name="Oil change", price=Decimal("50.00")
        )
        self.item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=Decimal("1000.00"),
            unit_price=Decimal("15.00"),
        )
        self.serial = 0

    def build_report(self):
        """Create one report with one task and one part, and return it."""
        self.serial += 1
        vehicle = Vehicle.objects.create(
            owner=self.owner,
            brand="Audi",
            model="A3",
            year=2015,
            license_plate=f"QC-{self.serial}",
        )
        report = Report.objects.create(
            vehicle=vehicle, user=self.user, status="completed"
        )
        Task.objects.create(report=report, task_template=self.template)
        Part.objects.create(report=report, part=self.item, quantity_used=Decimal("2.00"))
        return report

    def count_queries(self, url):
        with CaptureQueriesContext(connection) as captured:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
        return len(captured)

    def test_listing_reports_costs_the_same_for_one_row_and_for_five(self):
        self.build_report()
        one = self.count_queries(reverse("report-list"))

        for _ in range(4):
            self.build_report()
        five = self.count_queries(reverse("report-list"))

        self.assertEqual(
            five,
            one,
            f"listing 5 reports cost {five} queries and listing 1 cost {one}; "
            "the report queryset is missing prefetch_related",
        )

    def test_listing_invoices_costs_the_same_for_one_row_and_for_five(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        one = self.count_queries(reverse("invoice-list"))

        for index in range(2, 6):
            Invoice.objects.create(
                invoice_number=f"INV-{index}", report=self.build_report()
            )
        five = self.count_queries(reverse("invoice-list"))

        self.assertEqual(
            five,
            one,
            f"listing 5 invoices cost {five} queries and listing 1 cost {one}; "
            "the invoice queryset is missing select_related/prefetch_related",
        )

    def test_the_invoice_total_is_unchanged_by_eager_loading(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        row = self.client.get(reverse("invoice-list")).data[0]
        # one task at 50.00 plus two parts at 15.00 each
        self.assertEqual(Decimal(str(row["total_cost"])), Decimal("80.00"))

    def test_the_invoice_customer_fields_are_unchanged_by_eager_loading(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertEqual(row["owner_full_name"], "Ada Lovelace")
        self.assertEqual(row["vehicle_plate"], "QC-1")
