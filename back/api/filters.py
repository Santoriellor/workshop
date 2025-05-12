import django_filters
from .models import Owner

class OwnerFilter(django_filters.FilterSet):
    full_name = django_filters.CharFilter(method='filter_full_name')

    class Meta:
        model = Owner
        fields = ['email']

    def filter_full_name(self, queryset, name, value):
        # Custom filter logic to filter by full_name (concatenation of first_name + last_name)
        return queryset.filter(first_name__icontains=value) | queryset.filter(last_name__icontains=value)

