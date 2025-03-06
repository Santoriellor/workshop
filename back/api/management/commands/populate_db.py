from django.core.management.base import BaseCommand
from api.models import User, Owner, Vehicle, Report, Inventory, TaskTemplate
from faker import Faker
from faker_vehicle import VehicleProvider
import random

fake = Faker()
fake.add_provider(VehicleProvider)

def populate_inventory():
    inventory_data = [
        {"name": "Air Filter", "reference_code": "AF123", "category": "Engine", "quantity_in_stock": 50, "unit_price": 15.99},
        {"name": "Oil Filter", "reference_code": "OF456", "category": "Engine", "quantity_in_stock": 60, "unit_price": 12.50},
        {"name": "Spark Plug", "reference_code": "SP789", "category": "Engine", "quantity_in_stock": 100, "unit_price": 8.75},
        {"name": "Timing Belt", "reference_code": "TB234", "category": "Engine", "quantity_in_stock": 20, "unit_price": 35.00},
        {"name": "Serpentine Belt", "reference_code": "SB567", "category": "Engine", "quantity_in_stock": 30, "unit_price": 25.50},
        {"name": "Brake Pads", "reference_code": "BP890", "category": "Brakes", "quantity_in_stock": 40, "unit_price": 45.00},
        {"name": "Brake Rotors", "reference_code": "BR345", "category": "Brakes", "quantity_in_stock": 25, "unit_price": 80.00},
        {"name": "Shock Absorbers", "reference_code": "SA678", "category": "Suspension", "quantity_in_stock": 15, "unit_price": 120.00},
        {"name": "Struts", "reference_code": "ST901", "category": "Suspension", "quantity_in_stock": 10, "unit_price": 150.00},
        {"name": "Control Arm", "reference_code": "CA234", "category": "Suspension", "quantity_in_stock": 20, "unit_price": 90.00},
        {"name": "Tie Rod End", "reference_code": "TRE567", "category": "Steering", "quantity_in_stock": 35, "unit_price": 40.00},
        {"name": "Battery", "reference_code": "BAT789", "category": "Electrical", "quantity_in_stock": 25, "unit_price": 110.00},
        {"name": "Alternator", "reference_code": "ALT456", "category": "Electrical", "quantity_in_stock": 12, "unit_price": 200.00},
        {"name": "Starter Motor", "reference_code": "SM123", "category": "Electrical", "quantity_in_stock": 15, "unit_price": 150.00},
        {"name": "Radiator", "reference_code": "RAD789", "category": "Cooling", "quantity_in_stock": 18, "unit_price": 220.00},
        {"name": "Coolant", "reference_code": "COL567", "category": "Fluids", "quantity_in_stock": 50, "unit_price": 20.00},
        {"name": "Brake Fluid", "reference_code": "BF234", "category": "Fluids", "quantity_in_stock": 60, "unit_price": 10.00},
        {"name": "Muffler", "reference_code": "MUF890", "category": "Exhaust", "quantity_in_stock": 10, "unit_price": 140.00},
        {"name": "Oxygen Sensor", "reference_code": "O2S345", "category": "Exhaust", "quantity_in_stock": 30, "unit_price": 75.00},
    ]
    
    for item in inventory_data:
        # Avoid duplicate entries
        inventory, created = Inventory.objects.get_or_create(reference_code=item["reference_code"], defaults=item)
        if created:
            print(f"Added: {inventory.name}")
        else:
            print(f"Skipped (already exists): {inventory.name}")


def populate_task_templates():
    task_data = [
        {"name": "Oil Change", "description": "Replace engine oil and oil filter", "price": 29.99},
        {"name": "Brake Inspection", "description": "Inspect brake pads, rotors, and fluid levels", "price": 19.99},
        {"name": "Tire Rotation", "description": "Rotate tires for even wear", "price": 15.00},
        {"name": "Battery Check", "description": "Check battery health and terminals", "price": 10.00},
        {"name": "Coolant Flush", "description": "Flush and replace engine coolant", "price": 49.99},
    ]

    for item in task_data:
        task, created = TaskTemplate.objects.get_or_create(name=item["name"], defaults=item)
        if created:
            print(f"Added TaskTemplate: {task.name}")
        else:
            print(f"Skipped TaskTemplate (already exists): {task.name}")
            

def populate_users():
    users = []
    for _ in range(5):
        username = fake.user_name()
        email = fake.email()
        password = "password123"
        user = User.objects.create(username=username, email=email)
        user.set_password(password)
        user.save()
        users.append(user)
        print(f'Created user: {user.username}')
    return users

def populate_owners():
    owners = []
    for _ in range(10):
        owner = Owner.objects.create(
            full_name=fake.name(),
            address=fake.address(),
            phone=fake.numerify(text='############'),
            email=fake.email()
        )
        print(f'Created owner: {owner.full_name}')
        owners.append(owner)
    return owners

def populate_vehicles(owners):
    vehicles = []
    for owner in owners:
        for _ in range(2):
            vehicle_info = fake.vehicle_object()
            year = vehicle_info.get("Year", fake.year())
            brand = vehicle_info.get("Make", "Unknown")
            model = vehicle_info.get("Model", "Unknown")

            vehicle = Vehicle.objects.create(
                owner=owner,
                model=model,
                brand=brand,
                license_plate=fake.license_plate(),
                year=year
            )
            print(f'Created vehicle for owner {owner.full_name}')
            vehicles.append(vehicle)
    return vehicles

def populate_reports(users, vehicles):
    for vehicle in vehicles:
        for _ in range(1):
            random_user = random.choice(users)
            Report.objects.create(
                vehicle=vehicle,
                user=random_user,
                remarks=fake.sentence(),
                status=fake.random_element(['pending', 'completed', 'in_progress', 'exported']),
                created_at=fake.date_time()
            )
            print(f'Created report for vehicle {vehicle.license_plate}')

class Command(BaseCommand):
    help = 'Populate the database with fake data'

    def add_arguments(self, parser):
        parser.add_argument('--all', action='store_true', help='Populate all tables')
        parser.add_argument('--users', action='store_true', help='Populate users')
        parser.add_argument('--owners', action='store_true', help='Populate owners')
        parser.add_argument('--vehicles', action='store_true', help='Populate vehicles (requires owners)')
        parser.add_argument('--reports', action='store_true', help='Populate reports (requires users and vehicles)')
        parser.add_argument('--inventory', action='store_true', help='Populate inventory')
        parser.add_argument('--tasks', action='store_true', help='Populate Task Templates')

    def handle(self, *args, **options):
        if options['all']:
            users = populate_users()
            owners = populate_owners()
            vehicles = populate_vehicles(owners)
            populate_reports(users, vehicles)
            populate_inventory()
            populate_task_templates()
            self.stdout.write(self.style.SUCCESS('Populated all tables!'))
        
        else:
            users = []
            owners = []
            vehicles = []

            if options['users']:
                users = populate_users()
            if options['owners']:
                owners = populate_owners()
            if options['vehicles']:
                if not owners:
                    owners = list(Owner.objects.all()) or populate_owners()
                vehicles = populate_vehicles(owners)
            if options['reports']:
                if not users:
                    users = list(User.objects.all()) or populate_users()
                if not vehicles:
                    vehicles = list(Vehicle.objects.all()) or populate_vehicles(owners)
                populate_reports(users, vehicles)
            if options['inventory']:
                populate_inventory()
            if options['tasks']:
                populate_task_templates()

            self.stdout.write(self.style.SUCCESS('Selected tables populated!'))
            