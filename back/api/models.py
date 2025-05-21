from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# -------------- USER & PROFILE --------------
class User(AbstractUser):
    """
    Custom user model that uses email as the login identifier.

    Overrides Django's default AbstractUser to use 'email' for authentication
    while keeping 'username' as a required field for legacy compatibility.
    """
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'  # Use email as the login credential
    REQUIRED_FIELDS = ['username']  # Username is still required for createsuperuser

    def profile(self):
        """Returns the user's profile if it exists, otherwise None."""
        try:
            return self.userprofile
        except UserProfile.DoesNotExist:
            return None

class UserProfile(models.Model):
    """
    Stores additional information about the user.

    Automatically created/updated via signals upon User creation/update.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    bio = models.CharField(max_length=100)
    image = models.ImageField(upload_to="user_images", default="default.jpg")
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

# -------- VEHICLE & OWNER MODELS --------
class Owner(models.Model):
    """
    Represents the owner of one or more vehicles.
    """
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def __str__(self):
        return self.full_name

class Vehicle(models.Model):
    """
    Stores vehicle details, linked to an owner.
    """
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE)
    brand = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    license_plate = models.CharField(max_length=20, unique=True)
    year = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.brand} {self.model} ({self.license_plate})"

    
# ---------- REPORT & TASKS ------------
class Report(models.Model):
    """
    Inspection or service report associated with a vehicle and a user.

    Tracks the status of vehicle inspection and repair tasks.
    """
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
    
    def delete(self, *args, **kwargs):
        """
        On delete, cascade and restore inventory quantities
        from related parts.
        """
        for part in self.part_set.all():
            part.delete()
        super().delete(*args, **kwargs)


class TaskTemplate(models.Model):
    """
    Blueprint for a repair or maintenance task.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
class Task(models.Model):
    """
    Specific task performed as part of a report.

    Links a TaskTemplate to a Report.
    """
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    task_template = models.ForeignKey(TaskTemplate, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        task_template_name = self.task_template.name if self.task_template else "Unknown Task"
        return f"{task_template_name} in Report {self.report.id}"
    
    
# -------- INVENTORY & REPAIR PARTS --------    
class Inventory(models.Model):
    """
    Represents a stock item that can be used for repairs.
    """
    name = models.CharField(max_length=100)
    reference_code = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    quantity_in_stock = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.reference_code})"
    
class Part(models.Model):
    """
    Part used in a report, linked to inventory.

    Automatically adjusts stock levels on save/delete.
    """
    report = models.ForeignKey(Report, on_delete=models.CASCADE)
    part = models.ForeignKey(Inventory, on_delete=models.CASCADE)
    quantity_used = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity_used}x {self.part.name} for {self.report}"

    def save(self, *args, **kwargs):
        """
        On save, deduct used quantity from inventory.

        Restores stock if updating an existing part entry.
        """
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
        """
        On delete, restore inventory quantity.
        """
        with transaction.atomic():
            self.part.quantity_in_stock += self.quantity_used
            self.part.save()
            super().delete(*args, **kwargs)


# -------- INVOICE --------
class Invoice(models.Model):
    """
    Invoice generated from a report, includes total cost and PDF export.
    """
    invoice_number = models.CharField(max_length=20, unique=True)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="invoice")
    issued_date = models.DateTimeField(default=timezone.now)
    """ total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) """
    pdf = models.FileField(upload_to='invoices/', null=True, blank=True)

    #def calculate_total_cost(self):
    #    """Automatically calculate total cost from linked repairs"""
    #    self.total_cost = sum(repair.total_cost or 0 for repair in self.repairs.all())
    #    self.save()

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.total_cost} CHF"
    
    @property
    def total_cost(self):
        """
        Dynamically calculates total cost from tasks and parts.
        """
        task_total = sum(
            task.task_template.price for task in self.report.task_set.all()
            if task.task_template and task.task_template.price
        )
        part_total = sum(
            part.quantity_used * part.part.unit_price for part in self.report.part_set.all()
        )
        return task_total + part_total

    
# Signals to create/update UserProfile when a User is created/updated
def create_user_profile(sender, instance, created, **kwargs):
    """Signal to create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    """Signal to save UserProfile when the User is saved."""
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()

post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)