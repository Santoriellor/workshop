from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from api.models import User

class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.user_data = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'strongpassword123'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='john@example.com').exists())

    def test_user_login(self):
        # First, register
        self.client.post(self.register_url, self.user_data)
        # Then, login
        response = self.client.post(self.login_url, {
            'email': 'john@example.com',
            'password': 'strongpassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check for the access and refresh tokens in the response
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
