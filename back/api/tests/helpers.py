"""Shared helpers for the API test suite.

The project's User model sets USERNAME_FIELD = 'email' (api/models.py), so a
user is identified by email everywhere except in the `username` column, which
is still required and still unique. Helpers here take both.
"""

from django.contrib.auth import get_user_model

User = get_user_model()

# Long enough for MinimumLengthValidator, not numeric, not a common password,
# and not similar to the usernames or emails used below. It therefore keeps
# working after Task 9 starts running AUTH_PASSWORD_VALIDATORS at registration.
DEFAULT_PASSWORD = "Str0ng-Test-Passphrase!"


def make_user(
    email="tester@example.com",
    username="tester",
    password=DEFAULT_PASSWORD,
):
    """Create and return a user. A post_save signal also creates its profile."""
    return User.objects.create_user(username=username, email=email, password=password)


def authenticate(client, user):
    """Attach `user` to `client` for every subsequent request, and return it."""
    client.force_authenticate(user=user)
    return client
