"""
Tests for the User API endpoint permissions.

`UserViewSet` previously set `permission_classes = []`, which overrides
`REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']` instead of inheriting it,
leaving `/api/users/` and `/api/users/<id>/` open to anyone on the internet
and exposing every account's username and email.

Ensures that:
- Unauthenticated users cannot list users.
- Unauthenticated users cannot retrieve a single user.
- Unauthenticated users cannot access `/users/me/`.
- Unauthenticated users can still use `/users/check_availability/`, since
  Register.jsx calls it with no token while the visitor is signing up.
- Authenticated users can still list users, proving the endpoint is not
  simply locked out of use.
"""

from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import User


class UserEndpointPermissionsTests(APITestCase):
    """
    Test suite for verifying access permissions on the user API endpoints.
    """
    def setUp(self):
        """
        Create a user to enumerate against, plus the relevant URLs.
        """
        self.user = User.objects.create_user(
            username='alice', email='alice@example.com', password='pass1234'
        )

        self.user_list_url = reverse('user-list')
        self.user_detail_url = reverse('user-detail', args=[self.user.id])
        self.user_me_url = reverse('user-me')
        self.check_availability_url = reverse('user-check-availability')

    def test_unauthenticated_user_cannot_list_users(self):
        """
        Unauthenticated GET /api/users/ must be rejected, not return the
        full list of usernames/emails.
        """
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_cannot_retrieve_single_user(self):
        """
        Unauthenticated GET /api/users/<id>/ must be rejected.
        """
        response = self.client.get(self.user_detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_cannot_access_me(self):
        """
        Unauthenticated GET /api/users/me/ must be rejected.
        """
        response = self.client.get(self.user_me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_can_check_availability(self):
        """
        check_availability must remain public: Register.jsx calls it with a
        bare unauthenticated fetch() while the visitor is signing up.
        """
        response = self.client.get(
            self.check_availability_url, {'username': self.user.username}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['username_taken'])

    def test_authenticated_user_can_list_users(self):
        """
        Authenticated GET /api/users/ must still succeed, proving the fix
        does not simply lock the endpoint out of use.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
