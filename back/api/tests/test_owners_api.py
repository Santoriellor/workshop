"""
Tests for the Owner API endpoints.

Covers basic CRUD functionality:
- Creating a new owner
- Listing all owners
- Retrieving a specific owner
- Updating owner details
- Deleting an owner
"""

from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Owner
from django.urls import reverse

class TestOwnerAPI(TestCase):
    """
    Test suite for the Owner model API endpoints.

    Uses Django REST Framework's APIClient to authenticate a user and perform
    CRUD operations on the Owner model via API endpoints.
    """
    def setUp(self):
        """
        Create a test user and authenticate them for API usage.
        """
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="testuser", password="testpass")
        self.client.force_authenticate(user=self.user)

    def test_create_owner(self):
        """
        Test the creation of a new owner via POST request.
        """
        url = reverse('owner-list')
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com"
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != 201:
            print("DEBUG:", response.status_code, response.data)
        self.assertEqual(response.status_code, 201)

    def test_list_owners(self):
        """
        Test listing all owners via GET request.
        """
        Owner.objects.create(first_name="Jane", last_name="Smith", email="jane@example.com")
        url = reverse('owner-list')
        response = self.client.get(url)
        if response.status_code != 200:
            print("DEBUG:", response.status_code, response.data)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
        
    def test_get_single_owner(self):
        """
        Test retrieving a specific owner by their ID.
        """
        owner = Owner.objects.create(first_name="Jane", last_name="Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        response = self.client.get(url)
        if response.status_code != 200:
            print("DEBUG:", response.status_code, response.data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['first_name'], owner.first_name)
        self.assertEqual(response.data['last_name'], owner.last_name)
        self.assertEqual(response.data['email'], owner.email)

    def test_update_owner(self):
        """
        Test updating an existing owner's details using PATCH.
        """
        owner = Owner.objects.create(first_name="Jane", last_name="Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        data = {
            "first_name": "Jany",
            "last_name": "Updated",
            "email": "updated@example.com",
            "updated_at": owner.updated_at
        }
        response = self.client.patch(url, data, format='json')
        if response.status_code != 200:
            print("DEBUG:", response.status_code, response.data)
        self.assertEqual(response.status_code, 200)
        owner.refresh_from_db()
        self.assertEqual(owner.first_name, "Jany")
        self.assertEqual(owner.last_name, "Updated")
        self.assertEqual(owner.email, "updated@example.com")

    def test_delete_owner(self):
        """
        Test deleting an owner via DELETE request.
        """
        owner = Owner.objects.create(first_name="Jane", last_name="Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        response = self.client.delete(url)
        if response.status_code != 204:
            print("DEBUG:", response.status_code, response.data)
        self.assertEqual(response.status_code, 204)
        # Check that the owner is actually deleted
        self.assertFalse(Owner.objects.filter(pk=owner.pk).exists())
