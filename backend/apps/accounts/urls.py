"""URL routes for accounts (/api/v1/auth/)."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from apps.accounts.views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    MongoTokenRefreshView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", MongoTokenRefreshView.as_view(), name="auth-refresh"),
    path("verify/", TokenVerifyView.as_view(), name="auth-verify"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("password/change/", ChangePasswordView.as_view(), name="auth-password-change"),
]

