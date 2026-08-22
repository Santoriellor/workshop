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


class OrderingFallbackTests(APITestCase):
    """A present-but-blank `ordering` value must fall back to
    `default_ordering`, on all three viewsets that use `OptionalPaginationMixin`.

    `request.query_params.get("ordering", self.default_ordering)` only
    substitutes the default when the key is *absent*. `?ordering=` (and
    anything that reduces to no real field names once split on commas) leaves
    `ordering` as `''`, and `''.split(",")` is `['']` - `order_by('')` then
    raises `FieldError`, a 500 on an authenticated endpoint. This pins the
    fallback for Report, Inventory and Invoice, and pins that valid ordering
    values still sort exactly as before.
    """

    def setUp(self):
        self.user = make_user(email="e@example.com", username="e")
        authenticate(self.client, self.user)

        Inventory.objects.create(
            name="Zebra filter",
            reference_code="REF-Z",
            quantity_in_stock=Decimal("1.00"),
            unit_price=Decimal("1.00"),
        )
        Inventory.objects.create(
            name="Alpha filter",
            reference_code="REF-A",
            quantity_in_stock=Decimal("1.00"),
            unit_price=Decimal("1.00"),
        )

        owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ordering@example.com"
        )
        # Created out of brand order, so a plain id-order listing would not
        # coincidentally match a vehicle__brand,vehicle__model ordering.
        vehicle_zeta = Vehicle.objects.create(
            owner=owner, brand="Zeta Motors", model="Q", year=2015, license_plate="ORD-Z"
        )
        vehicle_alpha = Vehicle.objects.create(
            owner=owner, brand="Alpha Motors", model="R", year=2016, license_plate="ORD-A"
        )
        vehicle_mid = Vehicle.objects.create(
            owner=owner, brand="Mid Motors", model="S", year=2017, license_plate="ORD-M"
        )
        vehicle_omega = Vehicle.objects.create(
            owner=owner, brand="Omega Motors", model="T", year=2018, license_plate="ORD-O"
        )
        self.expected_brand_order = [
            vehicle_alpha.id,
            vehicle_mid.id,
            vehicle_omega.id,
            vehicle_zeta.id,
        ]
        Report.objects.create(vehicle=vehicle_zeta, user=self.user, status="completed")
        Report.objects.create(vehicle=vehicle_alpha, user=self.user, status="completed")
        Report.objects.create(vehicle=vehicle_mid, user=self.user, status="completed")

        template = TaskTemplate.objects.create(name="Oil change", price=Decimal("50.00"))
        item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-ORD",
            quantity_in_stock=Decimal("20.00"),
            unit_price=Decimal("15.00"),
        )
        report_for_invoice = Report.objects.create(
            vehicle=vehicle_omega, user=self.user, status="completed"
        )
        Task.objects.create(report=report_for_invoice, task_template=template)
        Part.objects.create(report=report_for_invoice, part=item, quantity_used=Decimal("1.00"))
        Invoice.objects.create(invoice_number="ORD-000001", report=report_for_invoice)
        Invoice.objects.create(invoice_number="ORD-000002", report=report_for_invoice)

        self.endpoints = {
            "report": reverse("report-list"),
            "inventory": reverse("inventory-list"),
            "invoice": reverse("invoice-list"),
        }

    def assert_falls_back_to_default(self, url, query):
        default_response = self.client.get(url)
        response = self.client.get(url + query)
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"{url}{query} returned {response.status_code}, body={response.data!r}",
        )
        self.assertIsInstance(response.data, list)
        self.assertEqual(response.data, default_response.data)

    def test_empty_ordering_falls_back_for_all_three_endpoints(self):
        for name, url in self.endpoints.items():
            with self.subTest(endpoint=name):
                self.assert_falls_back_to_default(url, "?ordering=")

    def test_whitespace_only_ordering_falls_back_for_all_three_endpoints(self):
        for name, url in self.endpoints.items():
            with self.subTest(endpoint=name):
                self.assert_falls_back_to_default(url, "?ordering=%20")

    def test_only_separators_ordering_falls_back_for_all_three_endpoints(self):
        for name, url in self.endpoints.items():
            with self.subTest(endpoint=name):
                self.assert_falls_back_to_default(url, "?ordering=,")

    def test_empty_segment_among_valid_fields_falls_back_to_the_valid_fields(self):
        # "name,," on Inventory: the empty trailing segments are dropped, and
        # the one real field left ("name") is exactly what default_ordering
        # already is, so the result matches the unfiltered default.
        self.assert_falls_back_to_default(self.endpoints["inventory"], "?ordering=name,,")

    def test_valid_single_field_ordering_is_unaffected(self):
        response = self.client.get(self.endpoints["inventory"] + "?ordering=name")
        names = [row["name"] for row in response.data]
        self.assertEqual(names, ["Alpha filter", "Oil filter", "Zebra filter"])

    def test_valid_comma_separated_pair_ordering_is_unaffected(self):
        response = self.client.get(
            self.endpoints["report"] + "?ordering=vehicle__brand,vehicle__model"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        vehicle_ids = [row["vehicle"] for row in response.data]
        self.assertEqual(vehicle_ids, self.expected_brand_order)
