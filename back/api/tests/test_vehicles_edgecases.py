"""
Tests for vehicle creation edge cases via the Vehicle API.

Covers scenarios such as:
- Missing required fields
- Invalid data formats
- Duplicate constraints
- Unrealistic values
"""

from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import Vehicle, Owner

class VehicleEdgeCaseTests(APITestCase):
    """
    Test suite for validating edge cases during vehicle creation through the API.
    
    Ensures that the API returns appropriate validation errors for missing fields,
    incorrect formats, duplicate entries, and implausible values.
    """
    def setUp(self):
        """
        Set up an authenticated user and create a test owner.

        This includes:
        - Registering and logging in a test user
        - Retrieving an access token for authentication
        - Creating an owner record associated with the user
        """
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'strongpassword123'
        }
        self.client.post(self.register_url, self.user_data)

        # Login to get the access token
        login_response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'strongpassword123'
        })
        self.token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        # Create an Owner object linked to the user
        self.owner = Owner.objects.create(first_name="John", last_name="Doe", email="john@example.com", phone="1234567890")

    def test_create_vehicle_missing_required_fields(self):
        """
        Test that vehicle creation fails when required fields (license_plate, year) are missing.
        """
        # Missing license_plate and year
        invalid_data = {
            'brand': 'Toyota',
            'model': 'Yaris',
            'owner': self.owner.id
        }
        response = self.client.post(reverse('vehicle-list'), invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_plate', response.data)
        self.assertIn('year', response.data)

    def test_create_vehicle_with_invalid_year_format(self):
        """
        Test that vehicle creation fails when 'year' is not a valid integer.
        """
        invalid_data = {
            'brand': 'Toyota',
            'model': 'Yaris',
            'license_plate': 'BAD123',
            'year': 'two thousand twenty',
            'owner': self.owner.id
        }
        response = self.client.post(reverse('vehicle-list'), invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('year', response.data)

    def test_create_vehicle_with_duplicate_license_plate(self):
        """
        Test that duplicate license plates are not allowed.
        """
        Vehicle.objects.create(
            brand='Ford',
            model='Fusion',
            year=2017,
            license_plate='DUPLICATE123',
            owner=self.owner
        )
        duplicate_data = {
            'brand': 'Mazda',
            'model': '6',
            'year': 2019,
            'license_plate': 'DUPLICATE123',
            'owner': self.owner.id
        }
        response = self.client.post(reverse('vehicle-list'), duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_plate', response.data)

    def test_create_vehicle_with_extreme_year(self):
        """
        Test that extremely high future years (e.g. 9999) are rejected.
        """
        # Far future year
        data = {
            'brand': 'Tesla',
            'model': 'Cybertruck',
            'year': 9999,
            'license_plate': 'FUTURE999',
            'owner': self.owner.id
        }
        response = self.client.post(reverse('vehicle-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('year', response.data)
