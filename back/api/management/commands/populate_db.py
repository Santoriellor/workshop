from django.core.management.base import BaseCommand
from api.models import User, Owner, Vehicle, Report, Inventory, TaskTemplate, Task, Part
from faker import Faker
from faker_vehicle import VehicleProvider
import random
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_path = os.path.join(os.path.dirname(BASE_DIR), "data")
brands_models_path = os.path.join(data_path, "brands_models.json")
inventory_data_path = os.path.join(data_path, "inventory_data.json")
tasks_data_path = os.path.join(data_path, "tasks_data.json")

with open(brands_models_path, "r") as file:
    brands_models = json.load(file)
    brands_list = list(brands_models.keys())
    
with open(inventory_data_path, "r") as file:
    inventory_data = json.load(file)

with open(tasks_data_path, "r") as file:
    tasks_data = json.load(file)

fake = Faker()

def populate_inventory():        
    for item in inventory_data:
        # Avoid duplicate entries
        inventory, created = Inventory.objects.get_or_create(reference_code=item["reference_code"], defaults=item)
        if created:
            print(f"Added: {inventory.name}")
        else:
            print(f"Skipped (already exists): {inventory.name}")


def populate_task_templates():
    for item in tasks_data:
        # Avoid duplicate entries
        task, created = TaskTemplate.objects.get_or_create(name=item["name"], defaults=item)
        if created:
            print(f"Added TaskTemplate: {task.name}")
        else:
            print(f"Skipped TaskTemplate (already exists): {task.name}")
            

def populate_users():
    if User.objects.count() > 3:
        print("Users already populated.")
        return User.objects.all()
    
    users = []
    for _ in range(4):
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
    if Owner.objects.count() > 9:
        print("Owners already populated.")
        return Owner.objects.all()
    
    owners = []
    for _ in range(10):
        owner = Owner.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            address=fake.address(),
            phone=fake.numerify(text='############'),
            email=fake.email()
        )
        print(f'Created owner: {owner.first_name} {owner.last_name}')
        owners.append(owner)
    return owners

def populate_vehicles(owners):
    if Vehicle.objects.count() > 8:
        print("Vehicles already populated.")
        return Vehicle.objects.all()
    
    vehicles = []
    for owner in owners:
        for _ in range(random.randint(0, 2)):
            brand = random.choice(brands_list)
            model = random.choice(brands_models[brand])
            vehicle = Vehicle.objects.create(
                owner=owner,
                model=model,
                brand=brand,
                license_plate=fake.license_plate(),
                year=random.randint(2000, 2024)
            )
            vehicles.append(vehicle)
            print(f'Created vehicle: {brand} {model} for {owner.full_name}')
    return vehicles

def populate_reports(users, vehicles):
    if not Inventory.objects.exists():
        populate_inventory()
    if not TaskTemplate.objects.exists():
        populate_task_templates()
    
    if Report.objects.count() > 8:
        print("Reports already populated.")
        return Report.objects.all()
        
    for vehicle in vehicles:
        report = Report.objects.create(
            vehicle=vehicle,
            user=random.choice(users),
            remarks=fake.sentence(),
            status=fake.random_element(['pending', 'completed', 'in_progress']),
            created_at=fake.date_time()
        )
        
        # Add 1 to 3 tasks to the report
        tasks = TaskTemplate.objects.order_by('?')[:random.randint(1, 3)]
        for task_template in tasks:
            Task.objects.create(report=report, task_template=task_template)
        
        # Add 0 to 3 parts to the report
        parts = Inventory.objects.order_by('?')[:random.randint(0, 3)]
        for part in parts:
            if part.quantity_in_stock > 5:
                Part.objects.create(report=report, part=part, quantity_used=random.randint(1, 5))
            
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
            