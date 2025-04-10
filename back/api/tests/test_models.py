from django.test import TestCase
from api.models import Inventory, Part, Report, User, Owner, Vehicle

class PartModelTest(TestCase):
    def setUp(self):
        self.owner = Owner.objects.create(full_name="Alice", email="alice@example.com")
        self.vehicle = Vehicle.objects.create(owner=self.owner, brand="Toyota", model="Yaris", license_plate="AA123BB", year=2020)
        self.user = User.objects.create_user(username="user", email="user@example.com", password="pass123")
        self.report = Report.objects.create(vehicle=self.vehicle, user=self.user, status="pending")

        self.inventory = Inventory.objects.create(
            name="Brake Pad", reference_code="BRK001", quantity_in_stock=20, unit_price=30.00
        )

    def test_part_save_deducts_inventory(self):
        part = Part.objects.create(report=self.report, part=self.inventory, quantity_used=5)
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, 15)

    def test_part_save_raises_if_not_enough_stock(self):
        with self.assertRaisesMessage(Exception, "Not enough stock"):
            Part.objects.create(report=self.report, part=self.inventory, quantity_used=50)

    def test_part_delete_restores_inventory(self):
        part = Part.objects.create(report=self.report, part=self.inventory, quantity_used=5)
        part.delete()
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity_in_stock, 20)
        
    def test_userprofile_created_on_user_creation(self):
        user = User.objects.create_user(username="newbie", email="newbie@example.com", password="secret")
        self.assertTrue(hasattr(user, "userprofile"))