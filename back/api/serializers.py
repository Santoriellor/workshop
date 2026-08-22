import os
from datetime import datetime
from decimal import Decimal

from dateutil.parser import isoparse
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.dateformat import format
from django.utils.timezone import now
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .exceptions import ConflictException
from .models import (
    Inventory,
    Invoice,
    Owner,
    Part,
    Report,
    Task,
    TaskTemplate,
    User,
    UserProfile,
    Vehicle,
)


class ConcurrencyCheckMixin:
    """Rejects an update whose `updated_at` does not match the stored row.

    Five serializers carried an identical copy of this, differing only in the
    noun in the conflict message. `conflict_noun` supplies that noun. Creation
    is exempt: there is no stored row to compare against.
    """

    conflict_noun = "record"

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if self.instance is None:
            return attrs

        client_updated_at = self.initial_data.get("updated_at")
        if not client_updated_at:
            raise serializers.ValidationError("Missing 'updated_at' field for concurrency check.")

        try:
            client_parsed_updated_at = isoparse(client_updated_at)
        except Exception as exc:
            raise ValidationError("Invalid timestamp format.") from exc

        if abs((client_parsed_updated_at - self.instance.updated_at).total_seconds()) > 0.000001:
            raise ConflictException(
                f"This {self.conflict_noun} has been modified by someone else. " "Please refresh."
            )

        return attrs


# ------------------ AUTH & USER ------------------


class LoginSerializer(serializers.Serializer):
    """
    Handles user authentication via email and password.
    """

    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        if email and password:
            user = authenticate(request=self.context.get("request"), email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data["user"] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializes user profile details.
    """

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["full_name", "bio", "image", "verified"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializes user registration data.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, attrs):
        """Run AUTH_PASSWORD_VALIDATORS, which create_user does not.

        Django applies these validators from its auth forms, not from the model
        manager, so a serializer that calls create_user directly bypasses every
        one of them. The throwaway User instance gives
        UserAttributeSimilarityValidator something to compare against; it is
        never saved.
        """
        password = attrs.get("password")
        if password:
            candidate = User(
                username=attrs.get("username", ""),
                email=attrs.get("email", ""),
            )
            try:
                validate_password(password, candidate)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


# ------------------ OWNER & VEHICLE ------------------


class OwnerSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):
    """
    Serializes owner information.
    """

    conflict_noun = "owner"

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Owner
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class VehicleSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):
    """
    Serializes vehicle details and includes a string representation field.
    """

    conflict_noun = "vehicle"

    __str__ = serializers.SerializerMethodField()

    def get___str__(self, obj):
        return str(obj)

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_year(self, value):
        """
        Validates the 'year' field to ensure it is within a reasonable range.
        """
        current_year = datetime.now().year
        if value < 1900 or value > current_year:
            raise serializers.ValidationError(f"Year must be between 1900 and {current_year}.")
        return value


# ------------------ TASK & TEMPLATE ------------------


class TaskTemplateSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):
    """
    Serializes task templates.
    """

    conflict_noun = "task template"

    class Meta:
        model = TaskTemplate
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializes tasks that are linked to reports and templates.
    """

    task_template = serializers.PrimaryKeyRelatedField(queryset=TaskTemplate.objects.all())

    class Meta:
        model = Task
        fields = "__all__"


# ------------------ INVENTORY & PART ------------------


class InventorySerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):
    """
    Serializes inventory items with human-readable date formatting.
    """

    conflict_noun = "inventory part"

    formatted_created_at = serializers.SerializerMethodField()
    formatted_updated_at = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = "__all__"

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
        fields = "__all__"


# ------------------ REPORT ------------------


class ReportSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):
    """
    Serializes reports and includes nested task and part data.
    Allows creation and update of tasks and parts from report requests.
    Enforces concurrency control based on updated_at timestamp.
    """

    conflict_noun = "report"

    formatted_created_at = serializers.SerializerMethodField()
    formatted_updated_at = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    # Incoming task and part IDs
    tasks = serializers.ListField(write_only=True, child=serializers.IntegerField(), required=False)
    parts = serializers.ListField(write_only=True, child=serializers.DictField(), required=False)
    # Outgoing task and part data
    tasks_data = TaskSerializer(many=True, source="task_set", read_only=True)
    parts_data = PartSerializer(many=True, source="part_set", read_only=True)
    # The author is taken from the authenticated request in
    # ReportViewSet.perform_create, never from the request body. It stays in the
    # output because the UI labels rows with it.
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Report
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

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
        tasks = validated_data.pop("tasks", [])
        parts = validated_data.pop("parts", [])

        report = Report.objects.create(**validated_data)

        Task.objects.bulk_create(
            [Task(report=report, task_template_id=task_id) for task_id in tasks]
        )

        # Create parts one by one to trigger inventory logic
        for part_data in parts:
            Part.objects.create(
                report=report,
                part_id=part_data["part"],
                quantity_used=Decimal(part_data["quantity_used"]),
            )

        report.updated_at = now()
        report.save(update_fields=["updated_at"])

        return report

    def update(self, instance, validated_data):
        """
        Updates report, replacing all related tasks and parts.
        Ensures inventory consistency when parts change.
        """
        tasks = validated_data.pop("tasks", None)
        parts = validated_data.pop("parts", None)

        instance = super().update(instance, validated_data)

        # Replace all tasks if provided
        if tasks is not None:
            instance.task_set.all().delete()
            Task.objects.bulk_create(
                [Task(report=instance, task_template_id=task_id) for task_id in tasks]
            )

        # Replace all parts if provided
        if parts is not None:
            # Delete one-by-one to trigger inventory restoration
            for part in instance.part_set.all():
                part.delete()

            for part_data in parts:
                Part.objects.create(
                    report=instance,
                    part_id=part_data["part"],
                    quantity_used=Decimal(part_data["quantity_used"]),
                )

        instance.updated_at = now()
        instance.save(update_fields=["updated_at"])

        return instance


# ------------------ INVOICE ------------------


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializes invoices and includes human-readable issue date.
    """

    formatted_issued_date = serializers.SerializerMethodField()
    total_cost = serializers.ReadOnlyField()
    owner_full_name = serializers.SerializerMethodField()
    vehicle_plate = serializers.SerializerMethodField()
    pdf_exists = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = "__all__"

    def get_formatted_issued_date(self, obj):
        return format(obj.issued_date, "F j, Y")

    def get_owner_full_name(self, obj):
        try:
            return obj.report.vehicle.owner.full_name
        except AttributeError:
            return None

    def get_vehicle_plate(self, obj):
        try:
            return obj.report.vehicle.license_plate
        except AttributeError:
            return None

    def get_pdf_exists(self, obj):
        # Check if PDF field exists and the file is present on disk
        if not obj.pdf:
            return False
        pdf_path = os.path.join(settings.MEDIA_ROOT, obj.pdf.name)
        return os.path.exists(pdf_path)
