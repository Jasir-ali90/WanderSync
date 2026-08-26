"""Seed the demo admin + demo user accounts (idempotent)."""
from django.core.management.base import BaseCommand

from apps.accounts.documents import User
from apps.accounts.services import create_user


class Command(BaseCommand):
    help = "Create demo admin and demo user accounts if missing."

    def add_arguments(self, parser):
        parser.add_argument("--admin-email", default="admin@wandersync.test")
        parser.add_argument("--admin-password", default="Admin@12345")
        parser.add_argument("--user-email", default="demo@wandersync.test")
        parser.add_argument("--user-password", default="Demo@12345")

    def handle(self, *args, **options):
        admin_email = options["admin_email"]
        user_email = options["user_email"]

        if not User.objects(email=admin_email).first():
            admin = create_user(
                email=admin_email,
                password=options["admin_password"],
                full_name="WanderSync Admin",
            )
            admin.is_staff = True
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Admin created: {admin_email}"))
        else:
            admin = User.objects(email=admin_email).first()
            if not admin.is_staff:
                admin.is_staff = True
                admin.save()
            self.stdout.write(f"Admin already exists: {admin_email}")

        if not User.objects(email=user_email).first():
            create_user(
                email=user_email,
                password=options["user_password"],
                full_name="Demo Traveler",
            )
            self.stdout.write(self.style.SUCCESS(f"Demo user created: {user_email}"))
        else:
            self.stdout.write(f"Demo user already exists: {user_email}")