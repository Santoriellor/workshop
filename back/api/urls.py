from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserViewSet, UserProfileViewSet,
    OwnerViewSet, VehicleViewSet, ReportViewSet, TaskTemplateViewSet, InventoryViewSet, InvoiceViewSet
)

# DRF Router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profile', UserProfileViewSet, basename='userprofile')
router.register(r'owners', OwnerViewSet, basename='owner')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'task-templates', TaskTemplateViewSet, basename='task-template')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Include ViewSet routes
    path('', include(router.urls)),
]
