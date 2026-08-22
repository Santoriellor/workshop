# 0001 — Split settings by environment

## Status

Accepted and implemented (Task 10 of the `2026-08-22-workshop-refactor`
plan). `back/backend/settings.py` is now the package described below;
`docker-compose.yml` sets `DJANGO_ENV=production` on the backend service.

## Context

`back/backend/settings.py` is a single file used for local development, CI
and production alike, distinguished only by which environment variables
happen to be set. That has already produced three concrete problems, all
observed in the code as it stands today:

- `CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS').split(',')`
  (`settings.py:69`) raises `AttributeError` at import time whenever the
  variable is unset, because `os.getenv` returns `None` and `None` has no
  `.split`. There is no environment in which this variable is optional today.
- `load_dotenv(os.path.join(BASE_DIR, '.env'))` (`settings.py:56`) runs
  *after* `DJANGO_SECRET_KEY`, `MYSQL_USER` and `MYSQL_PASSWORD` are already
  read via `read_secret()` (`settings.py:51-53`). A developer relying on
  `back/.env` to supply those three values finds it does not work, because
  by the time `.env` is loaded the values it would have supplied were
  already needed and already failed or fallen through to the secrets mount.
- `CORS_ORIGIN_WHITELIST = ['http://localhost']` (`settings.py:261-263`) is
  the pre-3.0 setting name for `django-cors-headers`. The project pins
  `django-cors-headers` 4.6.0, which does not read this name at all — the
  setting is silently ignored, and the value that actually governs CORS is
  `CORS_ALLOWED_ORIGINS`.

## Decision

`backend/settings` becomes a package. Its `__init__.py` selects which
settings module to load based on `DJANGO_ENV`: `production` loads
`production.py`; anything else, including unset, loads `development.py`.
Common settings live in `base.py`, imported by both. Unset resolves to
development deliberately — it is the safe default for a workstation, for CI,
and for a container started without the compose environment applied — and
`development.py` keeps `DEBUG` driven by the `DEBUG` environment variable
(default `False`), exactly as the pre-split file did, rather than hardcoding
it on. Only `production.py` hardcodes `DEBUG = False` unconditionally, so a
missing `DJANGO_ENV` can never enable Django's debug pages on its own.

## Consequences

`DJANGO_SETTINGS_MODULE` stays `backend.settings` everywhere — the package
import path does not change even though what it resolves to does. This means
`manage.py`, `wsgi.py`, `asgi.py`, `pytest.ini` and `.github/workflows/deploy.yml`
are all untouched by this change; only the new package's internals encode the
per-environment differences. Production must set `DJANGO_ENV=production`,
which `docker-compose.yml` will set going forward.

The three defects above are fixed as part of this same task: `csv_env()` in
`base.py` replaces the bare `.split(',')` so an unset `CORS_ALLOWED_ORIGINS`
no longer raises `AttributeError` at import; `load_dotenv()` now runs before
`read_secret()` so `back/.env` can supply `DJANGO_SECRET_KEY`, `MYSQL_USER`
and `MYSQL_PASSWORD`; and `CORS_ORIGIN_WHITELIST` is dropped rather than
carried forward, per the finding recorded in
`docs/decisions/0005-deferred-findings.md`.

`manage.py check --deploy --fail-level ERROR` against `production.py`
exits 0 with exactly two expected warnings: `security.W004` (no
`SECURE_HSTS_SECONDS`) and `security.W008` (no `SECURE_SSL_REDIRECT`), both
deliberately absent because traefik already handles HSTS and the HTTPS
redirect — see the comment block at the end of `production.py`.
