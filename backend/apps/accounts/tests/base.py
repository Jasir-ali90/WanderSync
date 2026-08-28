"""Shared fixtures/helpers for accounts integration tests."""
from django.test import Client

from apps.accounts.documents import User

PASSWORD = "Sup3r-Secret-Pass!"  # noqa: S105 - test fixture only

REGISTER_URL = "/api/v1/auth/register/"
VERIFY_OTP_URL = "/api/v1/auth/verify-otp/"
LOGIN_URL = "/api/v1/auth/login/"
LOGOUT_URL = "/api/v1/auth/logout/"
REFRESH_URL = "/api/v1/auth/refresh/"
ME_URL = "/api/v1/auth/me/"
CHANGE_PW_URL = "/api/v1/auth/password/change/"

REGISTER_PAYLOAD = {
    "email": "amelia@example.com",
    "full_name": "Amelia Explorer",
    "password": PASSWORD,
}


class AccountsTestBase:
    """Mixin providing a JSON client and per-test collection wipe."""

    def setUp(self):
        self.client = Client()
        User.drop_collection()

    def tearDown(self):
        User.drop_collection()

    def register(self, payload=None):
        return self.client.post(
            REGISTER_URL, payload or REGISTER_PAYLOAD, content_type="application/json"
        )

    def activate(self, email=None):
        """Simulate the OTP verification step by activating the account."""
        user = User.objects(email=email or REGISTER_PAYLOAD["email"]).first()
        if user is not None:
            user.modify(email_verified=True, is_active=True, otp_hash="")

    def login(self, email=None, password=None):
        return self.client.post(
            LOGIN_URL,
            {
                "email": email or REGISTER_PAYLOAD["email"],
                "password": password or PASSWORD,
            },
            content_type="application/json",
        )

    def auth_client(self):
        """Register + activate, returning the client authenticated as that user."""
        self.register()
        self.activate()
        response = self.login()
        access = response.json()["data"]["tokens"]["access"]
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access}"
        return self.client



def error_code(body: dict) -> str:
    return body.get("error", {}).get("code", "")
