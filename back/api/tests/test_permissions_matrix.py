"""
Characterization tests for the permission boundary of every registered route.

These assert what the API does today so the refactor can be shown not to change
it. One group of routes is deliberately absent: /api/users/. Those were
reachable without credentials when this plan was written; the fix shipped
out-of-band on 2026-08-22 and they now return 401. Task 7 owns their
assertions in test_users_api.py - do not add them here, and do not assume
the old permissive behaviour when reading the rest of this task.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.tests.helpers import DEFAULT_PASSWORD, authenticate, make_user


class AnonymousAccessTests(APITestCase):
    """Every business route rejects a caller carrying no credentials."""

    def test_owner_list_rejects_anonymous(self):
        response = self.client.get(reverse("owner-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_vehicle_list_rejects_anonymous(self):
        response = self.client.get(reverse("vehicle-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_list_rejects_anonymous(self):
        response = self.client.get(reverse("report-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_task_template_list_rejects_anonymous(self):
        response = self.client.get(reverse("task-template-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inventory_list_rejects_anonymous(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invoice_list_rejects_anonymous(self):
        response = self.client.get(reverse("invoice-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_list_rejects_anonymous(self):
        response = self.client.get(reverse("userprofile-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_create_rejects_anonymous(self):
        response = self.client.post(
            reverse("owner-list"),
            {"first_name": "Nope", "last_name": "Nope"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PublicRouteTests(APITestCase):
    """The routes that are public on purpose stay public."""

    def test_register_is_public(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "publicuser",
                "email": "publicuser@example.com",
                "password": DEFAULT_PASSWORD,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_rejects_a_duplicate_email(self):
        make_user(email="dupe@example.com", username="dupe1")
        response = self.client.post(
            reverse("register"),
            {
                "username": "dupe2",
                "email": "dupe@example.com",
                "password": DEFAULT_PASSWORD,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_is_public_and_rejects_a_wrong_password(self):
        make_user(email="login@example.com", username="loginuser")
        response = self.client.post(
            reverse("login"),
            {"email": "login@example.com", "password": "definitely-not-it"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_both_tokens_and_the_user(self):
        make_user(email="login2@example.com", username="loginuser2")
        response = self.client.post(
            reverse("login"),
            {"email": "login2@example.com", "password": DEFAULT_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "login2@example.com")
        self.assertNotIn("password", response.data["user"])

    def test_token_refresh_rejects_a_garbage_token(self):
        response = self.client.post(
            reverse("token_refresh"), {"refresh": "not-a-token"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthenticatedAccessTests(APITestCase):
    """An authenticated caller reaches every business route."""

    def setUp(self):
        self.user = make_user(email="employee@example.com", username="employee")
        authenticate(self.client, self.user)

    def test_authenticated_caller_reaches_every_list_route(self):
        for url_name in (
            "owner-list",
            "vehicle-list",
            "report-list",
            "task-template-list",
            "inventory-list",
            "invoice-list",
            "userprofile-list",
        ):
            with self.subTest(route=url_name):
                response = self.client.get(reverse(url_name))
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_profile_list_shows_only_the_callers_own_profile(self):
        make_user(email="other@example.com", username="other")
        response = self.client.get(reverse("userprofile-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
