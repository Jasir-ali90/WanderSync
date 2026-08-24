"""Test runner that skips Django's relational-database machinery."""
from django.test.runner import DiscoverRunner


class NoDatabaseRunner(DiscoverRunner):
    """DiscoverRunner without test-database creation.

    WanderSync uses MongoDB, which is not managed by Django's test database
    layer. Tests use an isolated ``wandersync_test`` database and clean up
    after themselves (see apps/*/tests).
    """

    def setup_databases(self, **kwargs):  # noqa: D102
        return

    def teardown_databases(self, old_config, **kwargs):  # noqa: D102
        return
