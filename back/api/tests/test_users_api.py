"""
Security tests for the user endpoints.

Per spec decision D8 these assert the CORRECTED behaviour, not the current
behaviour. UserViewSet ships with `permission_classes = []`, which makes the
whole user table readable by anyone who can reach the API. Characterizing that
would make the deploy gate defend it, so these tests fail first and Task 7 makes
them pass.

check_availability stays public on purpose: the registration form calls it
before the visitor has any credentials.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.tests.helpers import DEFAULT_PASSWORD, authenticate, make_user


class AnonymousUserEndpointTests(APITestCase):
    def setUp(self):
        make_user(email="ada@example.com", username="ada")

    def test_user_list_rejects_anonymous(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_detail_rejects_anonymous(self):
        user = make_user(email="grace@example.com", username="grace")
        response = self.client.get(reverse("user-detail", kwargs={"pk": user.pk}))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_rejects_anonymous(self):
        response = self.client.get(reverse("user-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_response_body_leaks_an_email_to_an_anonymous_caller(self):
        for url in (reverse("user-list"), reverse("user-me")):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertNotIn("ada@example.com", response.content.decode())

    def test_check_availability_stays_public(self):
        response = self.client.get(
            reverse("user-check-availability") + "?username=ada"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["username_taken"])

    def test_check_availability_reports_a_free_email(self):
        response = self.client.get(
            reverse("user-check-availability") + "?email=nobody@example.com"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["email_taken"])


class AuthenticatedUserEndpointTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="ada@example.com", username="ada")
        authenticate(self.client, self.user)

    def test_user_list_is_readable_by_an_authenticated_caller(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_no_row_carries_a_password(self):
        response = self.client.get(reverse("user-list"))
        rows = response.data["results"] if isinstance(response.data, dict) else response.data
        for row in rows:
            with self.subTest(user=row["username"]):
                self.assertNotIn("password", row)

    def test_me_returns_the_caller(self):
        response = self.client.get(reverse("user-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["email"], "ada@example.com")
        self.assertNotIn("password", response.data)

    def test_the_endpoint_is_read_only(self):
        response = self.client.delete(
            reverse("user-detail", kwargs={"pk": self.user.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
