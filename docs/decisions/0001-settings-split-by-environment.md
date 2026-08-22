# 0001 — Split settings by environment

## Status

Accepted. Implemented by a later task in this refactor cycle (Task 10 of the
`2026-08-22-workshop-refactor` plan).

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
settings module to load based on `DJANGO_ENV` (e.g. `local`, `ci`,
`production`), rather than branching on ad-hoc environment variables inside
one flat file.

## Consequences

`DJANGO_SETTINGS_MODULE` stays `backend.settings` everywhere — the package
import path does not change even though what it resolves to does. This means
`manage.py`, `wsgi.py`, `asgi.py`, `pytest.ini` and `.github/workflows/deploy.yml`
are all untouched by this change; only the new package's internals encode the
per-environment differences. Production must set `DJANGO_ENV=production`,
which `docker-compose.yml` will set going forward.

This ADR records the decision only. The three defects above are not fixed by
this documentation phase; they are listed as present-day findings in
`docs/decisions/0005-deferred-findings.md` and fixed by the task that
implements this split.
