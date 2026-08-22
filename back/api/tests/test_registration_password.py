"""
Security tests for the registration password policy.

Per spec decision D8 these assert the CORRECTED behaviour. Registration accepts
any password today because DRF never runs AUTH_PASSWORD_VALIDATORS. These tests
fail first and Task 9 makes them pass.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import User
from api.tests.helpers import DEFAULT_PASSWORD


class RegistrationPasswordPolicyTests(APITestCase):
    def register(self, password, username="newbie", email="newbie@example.com"):
        return self.client.post(
            reverse("register"),
            {"username": username, "email": email, "password": password},
            format="json",
        )

    def test_a_one_character_password_is_rejected(self):
        response = self.register("a")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(email="newbie@example.com").exists())

    def test_a_short_password_is_rejected(self):
        response = self.register("abc123")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_an_entirely_numeric_password_is_rejected(self):
        response = self.register("9182736450")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_common_password_is_rejected(self):
        response = self.register("password123")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_password_that_is_the_username_is_rejected(self):
        response = self.register("verysimilaruser", username="verysimilaruser")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_strong_password_is_accepted(self):
        response = self.register(DEFAULT_PASSWORD)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newbie@example.com").exists())

    def test_the_error_body_explains_what_is_wrong(self):
        response = self.register("a")
        messages = " ".join(str(m) for m in response.data["password"])
        self.assertIn("8 characters", messages)
