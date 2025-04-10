from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import User, Vehicle, Owner


class VehiclePermissionsTests(APITestCase):
    def setUp(self):
        # User A
        self.user_a = User.objects.create_user(username='user_a', email='a@example.com', password='pass1234')
        self.owner_a = Owner.objects.create(full_name='User A', email='a@example.com', phone='1234567890')

        # User B
        self.user_b = User.objects.create_user(username='user_b', email='b@example.com', password='pass1234')
        self.owner_b = Owner.objects.create(full_name='User B', email='b@example.com', phone='9876543210')

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
        response = self.client.get(self.vehicle_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_user_cannot_create_vehicle(self):
        response = self.client.post(self.vehicle_list_url, {
            'brand': 'Mazda',
            'model': 'CX-5',
            'year': 2021,
            'license_plate': 'ZZZ111',
            'owner': self.owner_a.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)