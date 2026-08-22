"""Production settings.

Selected by DJANGO_ENV=production, which docker-compose.yml sets on the backend
service. TLS is terminated by traefik, so this module tells Django to trust the
forwarded scheme rather than performing its own redirect.
"""

from .base import *  # noqa: F401,F403
from .base import csv_env

# Not read from the environment. A production container must never serve debug
# pages, whatever DEBUG happens to be set to in back.env.
DEBUG = False

ALLOWED_HOSTS = csv_env("ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = csv_env("CORS_ALLOWED_ORIGINS")

# traefik terminates TLS and forwards over plain HTTP on the internal network,
# so without this Django believes every request is insecure and would refuse to
# set secure cookies.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"

# The Django admin posts forms; those origins must be trusted by name under
# Django 4+. Derived from ALLOWED_HOSTS so there is one list to maintain.
CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS if "." in host]

# Deliberately NOT set here:
#   SECURE_SSL_REDIRECT  - traefik already redirects the web entrypoint to
#                          websecure, and a second redirect inside Django would
#                          also catch the container healthcheck.
#   SECURE_HSTS_SECONDS  - traefik's security-headers@file middleware emits
#                          Strict-Transport-Security; setting it here too would
#                          send the header twice.
# `manage.py check --deploy` warns about both (W004, W008). Those two warnings
# are expected - see docs/decisions/0001-settings-split-by-environment.md.
