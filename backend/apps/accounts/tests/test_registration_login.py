"""Registration & login integration tests."""
from django.test import SimpleTestCase

from apps.accounts.documents import User

from .base import (
    LOGIN_URL,
    PASSWORD,
    REGISTER_PAYLOAD,
    REGISTER_URL,
    AccountsTestBase,
)


class RegistrationTests(AccountsTestBase, SimpleTestCase):
    def test_register_creates_pending_account(self):
        response = self.register()
        body = response.json()
        self.assertEqual(response.status_code, 201)
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["email"], REGISTER_PAYLOAD["email"])
        self.assertFalse(body["data"]["email_verified"])
        # No tokens until the OTP is verified.
        self.assertNotIn("tokens", body["data"])

    def test_register_persists_hashed_user(self):
        self.register()
        user = User.objects(email=REGISTER_PAYLOAD["email"]).first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))
        # The new account must not be active until email is verified.
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)

    def test_register_response_never_contains_password_hash(self):
        response = self.register()
        user = User.objects(email=REGISTER_PAYLOAD["email"]).first()
        self.assertNotIn(user.password, str(response.json()))

    def test_register_rejects_duplicate_email(self):
        self.register()
        response = self.register()
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_weak_password(self):
        response = self.register(
            {"email": "weak@example.com", "full_name": "W", "password": "123"}
        )
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_uppercase_email(self):
        response = self.register(
            {"email": "Upper@Example.com", "full_name": "X", "password": PASSWORD}
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"]["code"], "EMAIL_NOT_LOWERCASE"
        )

    def test_register_rejects_digits_in_name(self):
        response = self.register(
            {"email": "digits@example.com", "full_name": "Amar 123", "password": PASSWORD}
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "INVALID_NAME")

    def test_register_rejects_invalid_email(self):
        response = self.register(
            {"email": "not-an-email", "full_name": "X", "password": PASSWORD}
        )
        self.assertEqual(response.status_code, 400)

    def test_public_id_is_hex_uuid_not_objectid(self):
        self.register()
        user = User.objects(email=REGISTER_PAYLOAD["email"]).first()
        self.assertEqual(len(user.public_id), 32)
        self.assertTrue(all(c in "0123456789abcdef" for c in user.public_id))


class LoginTests(AccountsTestBase, SimpleTestCase):
    def test_login_success_returns_user_and_tokens(self):
        self.register()
        self.activate()
        response = self.login()
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", body["data"]["tokens"])
        self.assertEqual(body["data"]["user"]["email"], REGISTER_PAYLOAD["email"])

    def test_login_wrong_password_rejected(self):
        self.register()
        self.activate()
        response = self.login(password="WrongPassword!42")
        self.assertEqual(response.status_code, 401)

    def test_login_unknown_email_indistinguishable_from_bad_password(self):
        self.register()
        self.activate()
        wrong_pw = self.login(password="WrongPassword!42")
        unknown = self.client.post(
            LOGIN_URL,
            {"email": "ghost@example.com", "password": "whatever123"},
            content_type="application/json",
        )
        self.assertEqual(wrong_pw.status_code, unknown.status_code)
        self.assertEqual(
            wrong_pw.json()["message"],
            unknown.json()["message"],
            "Unknown-email error must not be distinguishable from bad password.",
        )

    def test_login_inactive_user_rejected(self):
        self.register()
        User.objects(email=REGISTER_PAYLOAD["email"]).update_one(set__is_active=False)
        response = self.login()
        self.assertEqual(response.status_code, 401)
