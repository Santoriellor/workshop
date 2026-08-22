"""Development and CI settings.

This is what `DJANGO_ENV` unset resolves to. It reproduces exactly what the
single settings.py did before the split: DEBUG comes from the environment and
defaults to off, and both host lists come from comma-separated variables.
"""

from .base import *  # noqa: F401,F403
from .base import csv_env, os

# Any of 1/true/yes enables it. Default off, so a forgotten variable is safe.
DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "yes"}

ALLOWED_HOSTS = csv_env("ALLOWED_HOSTS")

# Defaulted rather than mandatory. Reading it with a bare .split(',') used to
# raise AttributeError at import when the variable was missing.
CORS_ALLOWED_ORIGINS = csv_env("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
