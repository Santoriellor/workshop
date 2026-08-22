"""
Security tests for report attribution.

Per spec decision D8 these assert the CORRECTED behaviour. Today `user` is a
writable field on ReportSerializer and the client supplies it, so a report can
be filed under anyone's name. These tests fail first and Task 8 makes them pass.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Owner, Report, Vehicle
from api.tests.helpers import authenticate, make_user


class ReportAttributionTests(APITestCase):
    def setUp(self):
        self.author = make_user(email="author@example.com", username="author")
        self.colleague = make_user(email="colleague@example.com", username="colleague")
        authenticate(self.client, self.author)

        owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        self.vehicle = Vehicle.objects.create(
            owner=owner, brand="Audi", model="A3", year=2015, license_plate="OWN-1"
        )

    def test_a_new_report_is_attributed_to_the_caller(self):
        response = self.client.post(
            reverse("report-list"),
            {"vehicle": self.vehicle.id, "status": "pending"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(pk=response.data["id"])
        self.assertEqual(report.user_id, self.author.id)

    def test_a_supplied_user_id_is_ignored(self):
        response = self.client.post(
            reverse("report-list"),
            {
                "vehicle": self.vehicle.id,
                "status": "pending",
                "user": self.colleague.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(pk=response.data["id"])
        self.assertEqual(report.user_id, self.author.id)

    def test_an_update_cannot_reattribute_an_existing_report(self):
        report = Report.objects.create(vehicle=self.vehicle, user=self.author, status="pending")
        response = self.client.patch(
            reverse("report-detail", kwargs={"pk": report.pk}),
            {
                "status": "in_progress",
                "user": self.colleague.id,
                "updated_at": report.updated_at,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.user_id, self.author.id)
        self.assertEqual(report.status, "in_progress")

    def test_the_response_still_reports_who_owns_it(self):
        response = self.client.post(
            reverse("report-list"),
            {"vehicle": self.vehicle.id, "status": "pending"},
            format="json",
        )
        self.assertEqual(response.data["user"], self.author.id)
