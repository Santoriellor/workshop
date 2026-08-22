"""
Characterization tests for the optimistic-concurrency contract.

Five serializers implement the same check today: `OwnerSerializer`,
`VehicleSerializer`, `TaskTemplateSerializer`, `InventorySerializer` and
`ReportSerializer` (`back/api/serializers.py`). Each `validate()` reads
`self.initial_data["updated_at"]`, parses it with `dateutil.parser.isoparse`,
and compares it to `self.instance.updated_at` with a tolerance of one
microsecond:

- missing/falsy `updated_at`      -> `serializers.ValidationError(...)`  -> 400
- present but unparseable         -> `ValidationError("Invalid timestamp
  format.")`                                                             -> 400
- present, parseable, but stale   -> `ConflictException(...)` (`api/exceptions.py`,
  `status_code = 409`)                                                   -> 409
- present, parseable, and current -> no exception, update proceeds        -> 200

These are the only five models that carry an `updated_at` column at all
(`Owner`, `Vehicle`, `Report`, `TaskTemplate`, `Inventory` —
`back/api/models.py`). `Task`, `Part`, `Invoice` and `UserProfile` have no
`updated_at` field, so there is nothing for a check to compare against on
those; `Invoice.__str__` even reaches through `self.report` for a
"last-modified" notion rather than owning one. There is therefore no
serializer with an `updated_at` column that *skips* this check today: the
five that implement it are exactly the five models that have the field.

Response body shapes, confirmed by reading the DRF plumbing rather than
assumed:

- Every one of the five viewsets (`OwnerViewSet`, `VehicleViewSet`,
  `ReportViewSet`, `TaskTemplateViewSet`, `InventoryViewSet`) overrides
  `update()` identically:

      serializer = self.get_serializer(instance, data=request.data, partial=partial)
      if serializer.is_valid():
          serializer.save()
          return Response(serializer.data)
      return Response(serializer.errors, status=400)

  `Serializer.is_valid()` only catches `rest_framework.exceptions.ValidationError`
  (and Django's `ValidationError`). The missing/malformed branches raise
  exactly that class, so they land in the `else` branch as
  `Response(serializer.errors, status=400)`. DRF's `as_serializer_error`
  turns a bare string raised from `validate()` into
  `{"non_field_errors": [<message>]}` (`NON_FIELD_ERRORS_KEY`, unmodified by
  this project's `REST_FRAMEWORK` setting), so that is the exact 400 body.

  `ConflictException` is an `APIException` subclass, not a `ValidationError`
  subclass, so `is_valid()` does **not** catch it — it propagates out of the
  view's `update()` uncaught and is handled by DRF's default exception
  handler instead of the view's own `else` branch. That handler builds
  `{"detail": exc.detail}` for any `APIException` whose `.detail` is a plain
  string (it is, here), giving a 409 body of `{"detail": "<message>"}` where
  the message is the per-model sentence hardcoded in each `validate()`.

Task 12 collapses those five copies into one `ConcurrencyCheckMixin`, and
these tests are what proves the collapse changed nothing: same status codes,
same body *shape*, same per-model wording.
"""

from datetime import timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Inventory, Owner, Report, TaskTemplate, Vehicle
from api.tests.helpers import authenticate, make_user

MISSING_BODY = {
    "non_field_errors": ["Missing 'updated_at' field for concurrency check."]
}
MALFORMED_BODY = {"non_field_errors": ["Invalid timestamp format."]}


class ConcurrencyContractTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="employee@example.com", username="employee")
        authenticate(self.client, self.user)

        self.owner = Owner.objects.create(
            first_name="Jane", last_name="Smith", email="jane@example.com"
        )
        self.vehicle = Vehicle.objects.create(
            owner=self.owner,
            brand="Audi",
            model="A3",
            year=2015,
            license_plate="CONC-1",
        )
        self.template = TaskTemplate.objects.create(name="Oil change", price=50)
        self.item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=20,
            unit_price=15,
        )
        self.report = Report.objects.create(
            vehicle=self.vehicle, user=self.user, status="pending"
        )

    # ---- owners ----

    def test_owner_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MISSING_BODY)

    def test_owner_update_with_an_unparseable_updated_at_is_400_not_500(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": "yesterday"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MALFORMED_BODY)

    def test_owner_update_with_a_stale_updated_at_conflicts(self):
        stale = self.owner.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data,
            {
                "detail": "This owner has been modified by someone else. "
                "Please refresh."
            },
        )

    def test_owner_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": self.owner.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.first_name, "Janet")

    def test_creating_an_owner_needs_no_updated_at(self):
        response = self.client.post(
            reverse("owner-list"),
            {
                "first_name": "New",
                "last_name": "Owner",
                "email": "new.owner@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # ---- vehicles ----

    def test_vehicle_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("vehicle-detail", kwargs={"pk": self.vehicle.pk}),
            {"brand": "BMW"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MISSING_BODY)

    def test_vehicle_update_with_a_stale_updated_at_conflicts(self):
        stale = self.vehicle.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("vehicle-detail", kwargs={"pk": self.vehicle.pk}),
            {"brand": "BMW", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data,
            {
                "detail": "This vehicle has been modified by someone else. "
                "Please refresh."
            },
        )

    def test_vehicle_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("vehicle-detail", kwargs={"pk": self.vehicle.pk}),
            {"brand": "BMW", "updated_at": self.vehicle.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.brand, "BMW")

    # ---- task templates ----

    def test_task_template_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("task-template-detail", kwargs={"pk": self.template.pk}),
            {"name": "Oil change plus"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MISSING_BODY)

    def test_task_template_update_with_a_stale_updated_at_conflicts(self):
        stale = self.template.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("task-template-detail", kwargs={"pk": self.template.pk}),
            {"name": "Oil change plus", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data,
            {
                "detail": "This task template has been modified by someone "
                "else. Please refresh."
            },
        )

    def test_task_template_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("task-template-detail", kwargs={"pk": self.template.pk}),
            {"name": "Oil change plus", "updated_at": self.template.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.template.refresh_from_db()
        self.assertEqual(self.template.name, "Oil change plus")

    # ---- inventory ----

    def test_inventory_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("inventory-detail", kwargs={"pk": self.item.pk}),
            {"name": "Oil filter XL"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MISSING_BODY)

    def test_inventory_update_with_a_stale_updated_at_conflicts(self):
        stale = self.item.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("inventory-detail", kwargs={"pk": self.item.pk}),
            {"name": "Oil filter XL", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data,
            {
                "detail": "This inventory part has been modified by someone "
                "else. Please refresh."
            },
        )

    def test_inventory_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("inventory-detail", kwargs={"pk": self.item.pk}),
            {"name": "Oil filter XL", "updated_at": self.item.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, "Oil filter XL")

    # ---- reports ----
    # ReportViewSet.update() is a custom override of the same shape as the
    # other four viewsets, so the 400/409 plumbing is identical even though
    # ReportSerializer additionally stamps `updated_at = now()` itself inside
    # `update()`/`create()` (belt-and-suspenders on top of `auto_now=True`).

    def test_report_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("report-detail", kwargs={"pk": self.report.pk}),
            {"remarks": "Needs new brakes"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, MISSING_BODY)

    def test_report_update_with_a_stale_updated_at_conflicts(self):
        stale = self.report.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("report-detail", kwargs={"pk": self.report.pk}),
            {"remarks": "Needs new brakes", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.data,
            {
                "detail": "This report has been modified by someone else. "
                "Please refresh."
            },
        )

    def test_report_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("report-detail", kwargs={"pk": self.report.pk}),
            {"remarks": "Needs new brakes", "updated_at": self.report.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.report.refresh_from_db()
        self.assertEqual(self.report.remarks, "Needs new brakes")
