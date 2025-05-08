from datetime import datetime
from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.dateformat import format
from .models import (
    User, UserProfile,
    Owner, Vehicle,
    Report, TaskTemplate, Task,
    Part, Inventory,
    Invoice
)

# ------------------ AUTH & USER ------------------

class LoginSerializer(serializers.Serializer):
    """
    Handles user authentication via email and password.
    """
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data['user'] = user
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializes user profile details.
    """
    class Meta:
        model = UserProfile
        fields = ['full_name', 'bio', 'image', 'verified']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializes user registration data.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# ------------------ OWNER & VEHICLE ------------------

class OwnerSerializer(serializers.ModelSerializer):
    """
    Serializes owner information.
    """
    class Meta:
        model = Owner
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class VehicleSerializer(serializers.ModelSerializer):
    """
    Serializes vehicle details and includes a string representation field.
    """
    __str__ = serializers.SerializerMethodField()
    
    def get___str__(self, obj):
        return str(obj)
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def validate_year(self, value):
        """
        Validates the 'year' field to ensure it is within a reasonable range.
        """
        current_year = datetime.now().year
        if value < 1900 or value > current_year:
            raise serializers.ValidationError(f"Year must be between 1900 and {current_year}.")
        return value

# ------------------ TASK & TEMPLATE ------------------

class TaskTemplateSerializer(serializers.ModelSerializer):
    """
    Serializes task templates.
    """    
    class Meta:
        model = TaskTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializes tasks that are linked to reports and templates.
    """
    task_template = serializers.PrimaryKeyRelatedField(queryset=TaskTemplate.objects.all())

    class Meta:
        model = Task
        fields = '__all__'
        
# ------------------ INVENTORY & PART ------------------

class InventorySerializer(serializers.ModelSerializer):
    """
    Serializes inventory items with human-readable date formatting.
    """
    formatted_created_at = serializers.SerializerMethodField()
    formatted_updated_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Inventory
        fields = '__all__'
        
    def get_formatted_created_at(self, obj):
        return format(obj.created_at, "F j, Y")
    def get_formatted_updated_at(self, obj):
        return format(obj.updated_at, "F j, Y")

class PartSerializer(serializers.ModelSerializer):
    """
    Serializes parts used in reports.
    """
    part = serializers.PrimaryKeyRelatedField(queryset=Inventory.objects.all())
    quantity_used = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        model = Part
        fields = '__all__'

# ------------------ REPORT ------------------

class ReportSerializer(serializers.ModelSerializer):
    """
    Serializes reports and includes nested task and part data.
    Allows creation and update of tasks and parts from report requests.
    """
    formatted_created_at = serializers.SerializerMethodField()
    formatted_updated_at = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    # Incoming task and part IDs
    tasks = serializers.ListField(write_only=True, child=serializers.IntegerField(), required=False)
    parts = serializers.ListField(write_only=True, child=serializers.DictField(), required=False)
    # Outgoing task and part data
    tasks_data = TaskSerializer(many=True, source='task_set', read_only=True)
    parts_data = PartSerializer(many=True, source='part_set', read_only=True)
    
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_formatted_created_at(self, obj):
        return format(obj.created_at, "F j, Y")
    def get_formatted_updated_at(self, obj):
        return format(obj.updated_at, "F j, Y")
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def create(self, validated_data):
        """
        Creates a report and its associated tasks and parts.
        """
        tasks = validated_data.pop('tasks', [])
        parts = validated_data.pop('parts', [])

        report = Report.objects.create(**validated_data)

        Task.objects.bulk_create([
            Task(report=report, task_template_id=task_id) for task_id in tasks
        ])

        # Create parts one by one to trigger inventory logic
        for part_data in parts:
            Part.objects.create(
                report=report,
                part_id=part_data["part"],
                quantity_used=Decimal(part_data["quantity_used"])
            )

        return report
    
    def update(self, instance, validated_data):
        """
        Updates report, replacing all related tasks and parts.
        Ensures inventory consistency when parts change.
        """
        tasks = validated_data.pop('tasks', None)
        parts = validated_data.pop('parts', None)

        instance = super().update(instance, validated_data)

        # Replace all tasks if provided
        if tasks is not None:
            instance.task_set.all().delete()
            Task.objects.bulk_create([
                Task(report=instance, task_template_id=task_id) for task_id in tasks
            ])

        # Replace all parts if provided
        if parts is not None:
            # Delete one-by-one to trigger inventory restoration
            for part in instance.part_set.all():
                part.delete()
            
            for part_data in parts:
                Part.objects.create(
                    report=instance,
                    part_id=part_data["part"],
                    quantity_used=Decimal(part_data["quantity_used"])
                )

        return instance

# ------------------ INVOICE ------------------

class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializes invoices and includes human-readable issue date.
    """
    formatted_issued_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'
        
    def get_formatted_issued_date(self, obj):
        return format(obj.issued_date, "F j, Y")
