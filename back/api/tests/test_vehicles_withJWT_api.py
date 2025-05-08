"""
Tests for the Vehicle API endpoints including creation, listing, updating, and deletion.

This suite verifies that authenticated users can perform CRUD operations on vehicles,
and that the system properly stores and returns vehicle data.
"""

from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import Vehicle, Owner

class VehicleTests(APITestCase):
    """
    Test case for basic vehicle API functionality including create, list, update, and delete operations.
    """
    def setUp(self):
        """
        Register and authenticate a user, then create an owner linked to that user.

        Sets up valid data for vehicle creation used across test methods.
        """
        # 1. Register the user
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'strongpassword123'
        }
        self.client.post(self.register_url, self.user_data)
        
        # 2. Login to get the access token
        login_response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'strongpassword123'
        })
        self.token = login_response.data['access']  # Get the access token

        # 3. Set the authorization header for future requests
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        # 4. Create an Owner object (link it to the user)
        self.owner = Owner.objects.create(full_name="John Doe", email="john@example.com", phone="1234567890")
        
        # 5. Create a Vehicle object associated with the owner
        self.vehicle_data = {
            'owner': self.owner.id,
            'brand': 'Toyota',
            'model': 'Corolla',
            'license_plate': 'XYZ 123',
            'year': 2021,
        }


    def test_create_vehicle(self):
        """
        Test that an authenticated user can successfully create a vehicle.
        """
        # Send the POST request to create the vehicle
        response = self.client.post(reverse('vehicle-list'), self.vehicle_data, format='json')
         # Assert that the status code is 201 (Created)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Assert that the vehicle is created in the database
        self.assertTrue(Vehicle.objects.filter(license_plate='XYZ 123').exists())


    def test_list_vehicles(self):
        """
        Test that the vehicle list endpoint returns created vehicles for the authenticated user.
        """
        # Create a vehicle for the test
        Vehicle.objects.create(brand='Honda', model='Civic', year=2019, license_plate='ABC 789', owner=self.owner)
        
        # Send the GET request to list vehicles
        response = self.client.get(reverse('vehicle-list'))
        
        # Assert that the status code is 200
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert that the vehicle is in the response data
        self.assertIn('ABC 789', str(response.data))

    def test_update_vehicle(self):
        """
        Test that an authenticated user can update an existing vehicle's information.
        """
        # Create a vehicle in the database
        vehicle = Vehicle.objects.create(brand='Ford', model='Focus', year=2018, license_plate='DEF 456', owner=self.owner)
        url = reverse('vehicle-detail', args=[vehicle.id])
        updated_data = {
            'brand': 'Ford',
            'model': 'Focus',
            'year': 2021,
            'license_plate': 'DEF 456',
            'owner': self.owner.id
        }
        response = self.client.put(url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], 2021)

    def test_delete_vehicle(self):
        """
        Test that an authenticated user can delete an existing vehicle.
        """
        # Create a vehicle in the database
        vehicle = Vehicle.objects.create(brand='Nissan', model='Altima', year=2020, license_plate='GHI 789', owner=self.owner)
        url = reverse('vehicle-detail', args=[vehicle.id])  # Assuming you have a route for vehicle detail
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Vehicle.objects.count(), 0)  # Ensure the vehicle is deleted
