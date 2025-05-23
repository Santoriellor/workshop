"""
Tests for vehicle API permissions and access control.

Ensures that unauthenticated users are restricted from accessing or modifying vehicle data.
"""

from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import User, Vehicle, Owner


class VehiclePermissionsTests(APITestCase):
    """
    Test suite for verifying access permissions on the vehicle API endpoints.

    Specifically checks that:
    - Unauthenticated users cannot retrieve the list of vehicles
    - Unauthenticated users cannot create new vehicles
    """
    def setUp(self):
        """
        Set up two users and their associated owners.

        Also creates one vehicle associated with User A's owner to be used in tests.
        """
        # User A
        self.user_a = User.objects.create_user(username='user_a', email='a@example.com', password='pass1234')
        self.owner_a = Owner.objects.create(first_name="User", last_name="A", email='a@example.com', phone='1234567890')

        # User B
        self.user_b = User.objects.create_user(username='user_b', email='b@example.com', password='pass1234')
        self.owner_b = Owner.objects.create(first_name="User", last_name="B", email='b@example.com', phone='9876543210')

        # Vehicle belonging to User A's Owner
        self.vehicle = Vehicle.objects.create(
            brand='BMW',
            model='320i',
            year=2022,
            license_plate='A123XYZ',
            owner=self.owner_a
        )

        # URL for this vehicle
        self.vehicle_detail_url = reverse('vehicle-detail', args=[self.vehicle.id])
        self.vehicle_list_url = reverse('vehicle-list')

    def test_unauthenticated_user_cannot_access_vehicle_list(self):
        """
        Test that an unauthenticated user receives a 401 Unauthorized response when accessing the vehicle list.
        """
        response = self.client.get(self.vehicle_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_cannot_create_vehicle(self):
        """
        Test that an unauthenticated user receives a 401 Unauthorized response when attempting to create a vehicle.
        """
        response = self.client.post(self.vehicle_list_url, {
            'brand': 'Mazda',
            'model': 'CX-5',
            'year': 2021,
            'license_plate': 'ZZZ111',
            'owner': self.owner_a.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)