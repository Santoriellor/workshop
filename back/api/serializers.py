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

class LoginSerializer(serializers.Serializer):
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

class VehicleSerializer(serializers.ModelSerializer):
    __str__ = serializers.SerializerMethodField()
    
    def get___str__(self, obj):
        return str(obj)
    class Meta:
        model = Vehicle
        fields = '__all__'

class TaskTemplateSerializer(serializers.ModelSerializer):    
    class Meta:
        model = TaskTemplate
        fields = '__all__'

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
    
    class Meta:
        model = Report
        fields = '__all__'
        
    def get_formatted_created_at(self, obj):
        return format(obj.created_at, "F j, Y")
    def get_formatted_updated_at(self, obj):
        return format(obj.updated_at, "F j, Y")
    def get_status_display(self, obj):
        return obj.get_status_display()


class InvoiceSerializer(serializers.ModelSerializer):
    formatted_issued_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'
        
    def get_formatted_issued_date(self, obj):
        return format(obj.issued_date, "F j, Y")
