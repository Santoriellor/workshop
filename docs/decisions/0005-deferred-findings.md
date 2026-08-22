# 0005 — Deferred findings

## Status

Living document. Started during the documentation phase (Task 1) of the
`2026-08-22-workshop-refactor` plan; appended to by Tasks 8, 10, 12, 13, 14
and 16 as they run.

## Purpose

This records defects and risks the survey found that this refactor cycle
deliberately does not fix immediately — either because a later task in this
same plan fixes them (and this entry tracks that they are known, not
forgotten, until that task lands) or because they are out of scope for this
cycle entirely.

## Findings

### Open — fixed later in this plan

- **`ReportSerializer` uses `fields = '__all__'`.** This makes `Report.user`
  writable by any authenticated caller, so a caller can file a report under a
  colleague's name simply by setting `user` in the request body
  (`back/api/serializers.py:258-261`). Fixed by Task 8, which asserts the
  corrected behaviour as a new test per Spec D8 rather than pinning today's
  behaviour.
- **`UserSerializer.create` bypasses password validation.** It calls
  `User.objects.create_user(...)` directly
  (`back/api/serializers.py:64-70`), which never runs the serializer's field
  validators against `AUTH_PASSWORD_VALIDATORS`
  (`UserAttributeSimilarityValidator`, `MinimumLengthValidator`,
  `CommonPasswordValidator`, `NumericPasswordValidator` — all configured in
  `settings.py:153-166` but never invoked on this path). A one-character
  password registers successfully today. Fixed by Task 9.
- **Settings has three interrelated defects**, all present as of this
  writing:
  - `CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS').split(',')`
    (`settings.py:69`) raises `AttributeError` at import if the variable is
    unset — there is no default and no guard.
  - `load_dotenv()` (`settings.py:56`) runs *after* the `read_secret()` calls
    for `DJANGO_SECRET_KEY`, `MYSQL_USER` and `MYSQL_PASSWORD`
    (`settings.py:51-53`), so `back/.env` cannot supply those secrets no
    matter what it contains.
  - `CORS_ORIGIN_WHITELIST` (`settings.py:261-263`) is the pre-3.0
    `django-cors-headers` setting name; the project pins `django-cors-headers`
    4.6.0, which ignores it entirely — only `CORS_ALLOWED_ORIGINS` has any
    effect.

  Fixed by Task 10, alongside the settings-package split recorded in
  `docs/decisions/0001-settings-split-by-environment.md`.

### Deferred beyond this plan

- **JWT stored in `localStorage`.** See
  `docs/decisions/0004-jwt-in-localstorage.md` for the full finding. Not
  fixed in this cycle; moving to httpOnly cookies needs a CSRF story and a
  backend contract change that is out of scope here.
- **`read_secret()` lets an environment variable silently win over a mounted
  Docker secret.** See `docs/decisions/0003-secrets-are-read-only.md`.
  `secrets/` and the code path that reads it are treated as read-only for
  this cycle.
- **`nginx/media` on the VPS is a root-owned leftover** from an earlier
  architecture. Nothing in `docker-compose.yml` or
  `nginx/frontend/nginx.conf` references it; the deploy workflow now excludes
  it from the `rsync --delete` sync (`--exclude "nginx/media"`) because rsync
  cannot remove a root-owned path without root access on the VPS. Cleaning it
  up requires an operator with root on the deployment host; it is not
  something this repository's tooling can do on its own.
- **Nothing formats or lints the backend.** Only `front` has Prettier/ESLint
  configured today. The estate spec's D4 introduces ruff for Python as an
  isolated formatter-sweep commit; that lands in this cycle's refactor phase,
  not the documentation phase.

<!-- Tasks 8, 10, 12, 13, 14 and 16 append their own entries below this line. -->
