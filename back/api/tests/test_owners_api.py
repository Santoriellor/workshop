# api/tests/test_owners_api.py

from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from api.models import Owner
from django.urls import reverse

class TestOwnerAPI(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="testuser", password="testpass")
        self.client.force_authenticate(user=self.user)

    def test_create_owner(self):
        url = reverse('owner-list')
        data = {
            "full_name": "John Doe",
            "email": "john@example.com"
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != 201:
            print(f"Error: {response.data}")
        self.assertEqual(response.status_code, 201)

    def test_list_owners(self):
        Owner.objects.create(full_name="Jane Smith", email="jane@example.com")
        url = reverse('owner-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
        
    def test_get_single_owner(self):
        # Test to get a single owner by ID
        owner = Owner.objects.create(full_name="Jane Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['full_name'], owner.full_name)
        self.assertEqual(response.data['email'], owner.email)

    def test_update_owner(self):
        # Test to update an existing owner
        owner = Owner.objects.create(full_name="Jane Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        data = {
            "full_name": "Jane Updated",
            "email": "updated@example.com"
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, 200)
        owner.refresh_from_db()
        self.assertEqual(owner.full_name, "Jane Updated")
        self.assertEqual(owner.email, "updated@example.com")

    def test_delete_owner(self):
        # Test to delete an owner
        owner = Owner.objects.create(full_name="Jane Smith", email="jane@example.com")
        url = reverse('owner-detail', kwargs={'pk': owner.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        # Check that the owner is actually deleted
        self.assertFalse(Owner.objects.filter(pk=owner.pk).exists())
