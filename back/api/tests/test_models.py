from django.test import TestCase
from api.models import Inventory, Part, Report, User, Owner, Vehicle

class PartModelTest(TestCase):
    """
    Test suite for the Part model and its interaction with Inventory and Report models.

    Verifies:
    - Inventory quantity is correctly reduced when a Part is created.
    - Part creation fails if requested quantity exceeds available inventory.
    - Inventory quantity is restored when a Part is deleted.
    - UserProfile is automatically created when a User is created.
    """
    def setUp(self):
        """
        Set up necessary objects including Owner, Vehicle, User, Report, and Inventory
        for testing Part model behavior.
        """
        self.owner = Owner.objects.create(first_name="Alice", last_name="Doodle", email="alice@example.com")
        self.vehicle = Vehicle.objects.create(owner=self.owner, brand="Toyota", model="Yaris", license_plate="AA123BB", year=2020)
        self.user = User.objects.create_user(username="user", email="user@example.com", password="pass123")
        self.report = Report.objects.create(vehicle=self.vehicle, user=self.user, status="pending")

        self.inventory = Inventory.objects.create(
            name="Brake Pad", reference_code="BRK001", quantity_in_stock=20, unit_price=30.00
        )

    def test_part_save_deducts_inventory(self):
        """
        Test that creating a Part correctly deducts the quantity from inventory.
        """
        part = Part.objects.create(report=self.report, part=self.inventory, quantity_used=5)
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, 15)

    def test_part_save_raises_if_not_enough_stock(self):
        """
        Test that creating a Part with a quantity greater than available inventory raises an error.
        """
        with self.assertRaisesMessage(Exception, "Not enough stock"):
            Part.objects.create(report=self.report, part=self.inventory, quantity_used=50)

    def test_part_delete_restores_inventory(self):
        """
        Test that deleting a Part restores the deducted inventory quantity.
        """
        part = Part.objects.create(report=self.report, part=self.inventory, quantity_used=5)
        part.delete()
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, 20)
        
    def test_userprofile_created_on_user_creation(self):
        """
        Test that a UserProfile instance is automatically created when a User is created.
        """
        user = User.objects.create_user(username="newbie", email="newbie@example.com", password="secret")
        self.assertTrue(hasattr(user, "userprofile"))