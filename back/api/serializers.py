from datetime import datetime
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

#import logging

# Set up logger
#logger = logging.getLogger('myapiapp')

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        # Log the incoming payload (email and password)
        # logger.info(f"Received login request with email: {email} and password: {password}")

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                # logger.info("Invalid credentials, authentication failed.")
                raise serializers.ValidationError("Invalid email or password.")
        else:
            # logger.info("Missing email or password in request.")
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data['user'] = user
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'bio', 'image', 'verified']

class UserSerializer(serializers.ModelSerializer):
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

class OwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owner
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class VehicleSerializer(serializers.ModelSerializer):
    __str__ = serializers.SerializerMethodField()
    
    def get___str__(self, obj):
        return str(obj)
    class Meta:
        model = Vehicle
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def validate_year(self, value):
        current_year = datetime.now().year
        if value < 1900 or value > current_year:
            raise serializers.ValidationError(f"Year must be between 1900 and {current_year}.")
        return value

class TaskTemplateSerializer(serializers.ModelSerializer):    
    class Meta:
        model = TaskTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    task_template = serializers.PrimaryKeyRelatedField(queryset=TaskTemplate.objects.all())

    class Meta:
        model = Task
        fields = '__all__'
        

class InventorySerializer(serializers.ModelSerializer):
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
    part = serializers.PrimaryKeyRelatedField(queryset=Inventory.objects.all())
    class Meta:
        model = Part
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    formatted_created_at = serializers.SerializerMethodField()
    formatted_updated_at = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    # Allow tasks and parts to be passed in the report request body
    tasks = serializers.ListField(write_only=True, child=serializers.IntegerField(), required=False)
    parts = serializers.ListField(write_only=True, child=serializers.DictField(), required=False)
    # Allow tasks and parts to be passed in the report response body
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
        tasks = validated_data.pop('tasks', [])
        parts = validated_data.pop('parts', [])

        report = Report.objects.create(**validated_data)

        Task.objects.bulk_create([
            Task(report=report, task_template_id=task_id) for task_id in tasks
        ])

        Part.objects.bulk_create([
            Part(report=report, part_id=part_data["part"], quantity_used=part_data["quantity_used"])
            for part_data in parts
        ])

        return report
    
    def update(self, instance, validated_data):
        tasks = validated_data.pop('tasks', None)
        parts = validated_data.pop('parts', None)

        instance = super().update(instance, validated_data)

        # Handle tasks
        if tasks is not None:
            instance.task_set.all().delete()
            Task.objects.bulk_create([
                Task(report=instance, task_template_id=task_id) for task_id in tasks
            ])

        # Handle parts
        if parts is not None:
            instance.part_set.all().delete()
            Part.objects.bulk_create([
                Part(
                    report=instance,
                    part_id=part_data["part"],
                    quantity_used=part_data["quantity_used"]
                ) for part_data in parts
            ])

        return instance


class InvoiceSerializer(serializers.ModelSerializer):
    formatted_issued_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'
        
    def get_formatted_issued_date(self, obj):
        return format(obj.issued_date, "F j, Y")
