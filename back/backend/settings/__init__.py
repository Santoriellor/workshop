"""Environment-selected Django settings.

`backend.settings` stays the importable name every entry point already uses -
manage.py, wsgi.py, asgi.py, pytest.ini and .github/workflows/deploy.yml all
name it, and none of them change. Which module it loads is chosen by DJANGO_ENV.

Unset means development, which is the safe default for a workstation and for
CI. Production must set DJANGO_ENV=production; docker-compose.yml does that on
the backend service, so nothing on the deployment host has to be edited.
"""

import os

_ENV = os.getenv('DJANGO_ENV', 'development').strip().lower()

if _ENV == 'production':
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
