from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# -------------- USER & PROFILE --------------
class User(AbstractUser):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'  # Use email as the login credential
    REQUIRED_FIELDS = ['username']  # Username is still required for createsuperuser

    def profile(self):
        try:
            return self.userprofile
        except UserProfile.DoesNotExist:
            return None

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=1000)
    bio = models.CharField(max_length=100)
    image = models.ImageField(upload_to="user_images", default="default.jpg")
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.email

# -------- VEHICLE & OWNER MODELS --------
class Owner(models.Model):
    full_name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)

    def __str__(self):
        return self.full_name

class Vehicle(models.Model):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=20, unique=True)
    year = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.brand} {self.model} ({self.license_plate})"

    
# ---------- REPORT & TASKS ------------
class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('exported', 'Exported')
    ]

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report number {self.id} for {self.vehicle} - {self.status}"
    
    def get_status_display(self):
        """Returns the user-readable status."""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)


class TaskTemplate(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name
    
class Task(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    task_template = models.ForeignKey(TaskTemplate, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.task_template.name} in Report {self.report.id}"
    
    
# -------- INVENTORY & REPAIR PARTS --------    
class Inventory(models.Model):
    name = models.CharField(max_length=100)
    reference_code = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.reference_code})"
    
class Part(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    part = models.ForeignKey(Inventory, on_delete=models.CASCADE)
    quantity_used = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity_used}x {self.part.name} for {self.report}"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            # Fetch the previous state if updating
            if self.pk:
                previous_part = Part.objects.get(pk=self.pk)
                previous_inventory = previous_part.part

                # Restore previous inventory quantity if inventory changed or quantity was modified
                if previous_inventory == self.part:
                    previous_inventory.quantity_in_stock += previous_part.quantity_used
                    previous_inventory.save()
                else:
                    # If changing inventory item, restore the old one and update the new one
                    previous_inventory.quantity_in_stock += previous_part.quantity_used
                    previous_inventory.save()

            # Check if enough quantity is available
            if self.part.quantity_in_stock < self.quantity_used:
                raise ValidationError(f"Not enough stock for {self.part.name}.")

            # Deduct new quantity
            self.part.quantity_in_stock -= self.quantity_used
            self.part.save()

            super().save(*args, **kwargs)
            
    def delete(self, *args, **kwargs):
        """Restore inventory quantity when a part is deleted."""
        with transaction.atomic():
            self.part.quantity_in_stock += self.quantity_used
            self.part.save()
            super().delete(*args, **kwargs)


# -------- INVOICE --------
class Invoice(models.Model):
    invoice_number = models.CharField(max_length=20, unique=True)
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    issued_date = models.DateTimeField(default=timezone.now)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pdf = models.FileField(upload_to='invoices/', null=True, blank=True)

    def calculate_total_cost(self):
        """Automatically calculate total cost from linked repairs"""
        self.total_cost = sum(repair.total_cost or 0 for repair in self.repairs.all())
        self.save()

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total_cost} CHF"

    
# Signals to create/update UserProfile when a User is created/updated
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)