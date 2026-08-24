"""Profile, token lifecycle, and password-change integration tests."""
from django.test import SimpleTestCase

from apps.accounts.documents import User

from .base import (
    CHANGE_PW_URL,
    LOGOUT_URL,
    ME_URL,
    PASSWORD,
    REFRESH_URL,
    REGISTER_PAYLOAD,
    AccountsTestBase,
)


class MeTests(AccountsTestBase, SimpleTestCase):
    def test_me_requires_authentication(self):
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 401)

    def test_me_returns_current_profile(self):
        client = self.auth_client()
        response = client.get(ME_URL)
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["data"]["user"]["email"], REGISTER_PAYLOAD["email"])
        self.assertIn("profile", body["data"]["user"])

    def test_me_updates_travel_preferences(self):
        client = self.auth_client()
        response = client.patch(
            ME_URL,
            {
                "travel_style": "foodie",
                "interests": ["street food", "museums"],
                "preferred_currency": "EUR",
            },
            content_type="application/json",
        )
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["data"]["user"]["profile"]["travel_style"], "foodie")
        self.assertEqual(body["data"]["user"]["profile"]["preferred_currency"], "EUR")
        persisted = User.objects(email=REGISTER_PAYLOAD["email"]).first()
        self.assertEqual(persisted.profile.travel_style, "foodie")

    def test_invalid_travel_style_rejected(self):
        client = self.auth_client()
        response = client.patch(
            ME_URL, {"travel_style": "extreme"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_tampered_token_rejected(self):
        self.register()
        access = self.login().json()["data"]["tokens"]["access"]
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {access[:-2]}aa"
        response = self.client.get(ME_URL)
        self.assertEqual(response.status_code, 401)


class TokenLifecycleTests(AccountsTestBase, SimpleTestCase):
    def test_refresh_issues_new_access_token(self):
        self.register()
        refresh = self.login().json()["data"]["tokens"]["refresh"]
        response = self.client.post(
            REFRESH_URL, {"refresh": refresh}, content_type="application/json"
        )
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", body.get("data", body))

    def test_refresh_rejects_garbage_token(self):
        response = self.client.post(
            REFRESH_URL, {"refresh": "garbage"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    def test_logout_requires_authentication(self):
        response = self.client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, 401)

    def test_logout_with_valid_token_succeeds(self):
        client = self.auth_client()
        response = client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, 200)


class PasswordChangeTests(AccountsTestBase, SimpleTestCase):
    def test_change_password_success_and_relogin(self):
        client = self.auth_client()
        new_password = "Br4nd-New-Pass!"
        response = client.post(
            CHANGE_PW_URL,
            {"current_password": PASSWORD, "new_password": new_password},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        # Old password must stop working; the new one must work.
        self.assertEqual(self.login(password=PASSWORD).status_code, 401)
        self.assertEqual(self.login(password=new_password).status_code, 200)

    def test_change_password_wrong_current(self):
        client = self.auth_client()
        response = client.post(
            CHANGE_PW_URL,
            {"current_password": "Not-My-Password!", "new_password": "Another-Pass-99"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_change_password_weak_new_rejected(self):
        client = self.auth_client()
        response = client.post(
            CHANGE_PW_URL,
            {"current_password": PASSWORD, "new_password": "short"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_change_password_returns_fresh_tokens(self):
        client = self.auth_client()
        response = client.post(
            CHANGE_PW_URL,
            {"current_password": PASSWORD, "new_password": "Br4nd-New-Pass!"},
            content_type="application/json",
        )
        body = response.json()
        self.assertIn("tokens", body.get("data", {}))
