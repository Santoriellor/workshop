# workshop Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document workshop to the estate standard, extend its pytest and vitest suites to pin the behaviour the existing suites leave uncovered, fix the defects found during the survey, and refactor the code onto one consistent set of patterns without changing its stack.

**Architecture:** Django 5.1 + DRF backend behind traefik, React 19 SPA built by Vite and served by an unprivileged nginx, MySQL 8. Work proceeds in four phases — document, characterize, refactor, verify — where the characterization suite is what makes the refactor phase safe. The refactor closes an unauthenticated user-enumeration hole, stops the API trusting a client-supplied `Report.user`, splits `settings.py` into an environment-selected package, removes three N+1 query patterns, collapses five copies of a hand-written `update()` and three copies of a hand-written `list()` into shared mixins, consolidates every HTTP call onto one axios client, and only then moves off `axios@0.27`.

**Tech Stack:** Python 3.12, Django 5.1.5, djangorestframework 3.15.2, djangorestframework-simplejwt 5.4.0, django-filter 25.1, django-cors-headers 4.6.0, mysqlclient, WeasyPrint, gunicorn, pytest 8.3.5 + pytest-django 4.11.1, MySQL 8.0, React 19, Vite 6, zustand 5, react-router-dom 7, axios, vitest 3 + @testing-library/react 16, Docker Compose, nginx, traefik.

**Spec:** `docs/superpowers/specs/2026-08-22-estate-refactor-design.md` (committed by Task 1)

## Global Constraints

- **Stack does not change.** No framework, build-tool or language migration. React stays React 19 on Vite, Django stays Django 5.1, MySQL stays MySQL. No TypeScript migration — the frontend stays JavaScript. (Spec D1)
- **Documentation file set is fixed and named exactly:** `README.md`, `docs/architecture.md`, `docs/design.md`, `docs/technical.md`, `docs/runbook.md`, `docs/decisions/NNNN-*.md`. No `CLAUDE.md`. (Spec D2)
- **Characterization tests assert current behaviour, never desired behaviour.** (Spec D3)
- **Security defects are the sole exception:** they are fixed TDD-style against the corrected behaviour, never pinned. Tasks 7, 8 and 9 are the three such fixes in this plan, and each says so in its heading. (Spec D8)
- **`secrets/` is read-only for this work.** Nothing in this plan edits `secrets/`, `/srv/secrets/workshop/`, or the `secrets:` block of `docker-compose.yml`. Findings about secrets go into `docs/decisions/0003-secrets-are-read-only.md`. (Spec §6)
- **`axios@0.27` is upgraded, but only after the frontend characterization suite is green.** Task 6 writes that suite; Task 14 performs the bump; nothing between them touches the axios version. (Spec D5)
- **The formatter sweep is one commit containing formatting only**, and its SHA is appended to `.git-blame-ignore-revs`. For this repository that is **ruff** (lint + format) for Python and **Prettier + ESLint** for the frontend. `front/.eslintrc.js` and `front/.prettierrc` already exist: their settings are preserved verbatim, not replaced. The sweep is the last task of Phase C. (Spec D4)
- **`deploy.yml` gates deploy on tests.** A red suite blocks deployment of a live site. Never commit a failing or flaky test to `main`.
- **Branch:** all work happens on `refactor/workshop`. The executor does **not** merge and does **not** open a pull request. Merges to `main` are performed by the reviewing session. (Spec D6)
- **The backend suite needs a MySQL.** `back/backend/settings.py` hard-codes `django.db.backends.mysql`; there is no SQLite fallback and this plan does not add one. Task 2 stands one up. Every backend test command in this plan is written out in full, with the environment variables inline, because the shell does not persist between steps.
- **Shell:** commands are POSIX shell (Git Bash on Windows, or any Linux shell). Use forward slashes.

---

## File Structure

**Created — documentation**

| File | Responsibility |
|---|---|
| `docs/architecture.md` | Components, boundaries, request flow, deployment topology |
| `docs/design.md` | Domain model (User, Owner, Vehicle, Report, Task, Part, Inventory, Invoice), report lifecycle, invoicing intent |
| `docs/technical.md` | Build, run, environment variables, secrets layout, CI, formatting tooling |
| `docs/runbook.md` | Logs, backup and restore of `mysql_volume`, common incidents |
| `docs/decisions/0001-settings-split-by-environment.md` | Why `settings.py` becomes a package selected by `DJANGO_ENV` |
| `docs/decisions/0002-permission-baseline.md` | Permissions are declared on every viewset; public access is opt-in per action |
| `docs/decisions/0003-secrets-are-read-only.md` | What `secrets/` and `/srv/secrets/workshop/` hold and why this cycle does not touch them |
| `docs/decisions/0004-jwt-in-localstorage.md` | The access and refresh tokens live in `localStorage`; consequences, and why it is not changed here |
| `docs/decisions/0005-deferred-findings.md` | Known problems deliberately not fixed in this cycle |
| `docs/superpowers/specs/2026-08-22-estate-refactor-design.md` | Committed copy of the estate design document |
| `docs/reference/` | The three pre-existing PDFs, moved here unchanged |

**Created — backend production code**

| File | Responsibility |
|---|---|
| `back/api/pagination.py` | `CustomPagination`, moved out of `views.py` so both `views.py` and `mixins.py` can import it without a cycle |
| `back/api/mixins.py` | `OptionalPaginationMixin` — the list-unless-asked-to-paginate behaviour, previously copied into three viewsets |
| `back/backend/settings/__init__.py` | Selects a settings module from `DJANGO_ENV`; keeps `backend.settings` importable so no entry point changes |
| `back/backend/settings/base.py` | Everything common; reads secrets and database configuration |
| `back/backend/settings/development.py` | `DEBUG` from the environment, permissive hosts, no transport hardening |
| `back/backend/settings/production.py` | `DEBUG = False` unconditionally, cookie and proxy hardening |
| `back/requirements-dev.txt` | `ruff`, pinned. Not installed into the production image. |

**Modified — backend**

| File | Change |
|---|---|
| `back/api/views.py` | `UserViewSet` gains a permission baseline; `ReportViewSet` sets `user` from the request; three hand-written `list()` overrides collapse into `OptionalPaginationMixin`; five hand-written `update()` overrides are deleted; querysets gain `select_related`/`prefetch_related` |
| `back/api/serializers.py` | `ConcurrencyCheckMixin` replaces five identical `validate()` copies; `UserSerializer` runs Django's password validators; `ReportSerializer.user` becomes read-only |
| `back/backend/settings.py` | Deleted, replaced by the `settings/` package |
| `docker-compose.yml` | The `backend` service sets `DJANGO_ENV: "production"` |
| `.github/workflows/deploy.yml` | Adds a ruff check and an ESLint check to the existing test job |
| `README.md` | Rewritten as an entry point |

**Created — backend tests**

| File | Responsibility |
|---|---|
| `back/api/tests/helpers.py` | `make_user()` and `authenticate()`, shared by the new modules |
| `back/api/tests/test_permissions_matrix.py` | Characterizes which routes reject an anonymous caller |
| `back/api/tests/test_concurrency_api.py` | Characterizes the `updated_at` 400/409/200 contract |
| `back/api/tests/test_catalog_api.py` | Characterizes inventory, task templates and invoices, including the optional-pagination response shape |
| `back/api/tests/test_users_api.py` | Asserts the **corrected** behaviour of `/api/users/` (Task 7) |
| `back/api/tests/test_report_ownership.py` | Asserts the **corrected** ownership behaviour of `POST /api/reports/` (Task 8) |
| `back/api/tests/test_registration_password.py` | Asserts the **corrected** password policy at registration (Task 9) |
| `back/api/tests/test_query_counts.py` | Asserts the report and invoice list endpoints issue a constant number of queries (Task 11) |

**Created — frontend tests**

| File | Responsibility |
|---|---|
| `front/src/__tests__/utils/axiosInstance.test.js` | Characterizes the base URL, the bearer header, and the 401 refresh-and-replay path |
| `front/src/__tests__/contexts/AuthContext.test.jsx` | Characterizes login token storage, user hydration and logout |
| `front/src/__tests__/stores/stores.contract.test.js` | Characterizes the paginated and unpaginated store branches |
| `front/src/__tests__/components/Login.test.jsx` | Covers the submit-disabled-while-loading behaviour fixed in Task 13 |

**Modified — frontend**

| File | Change |
|---|---|
| `front/src/utils/axiosInstance.js` | Exports `API_BASE_URL`; the retry is guarded so a second 401 cannot loop |
| `front/src/utils/authUtils.js` | Imports `API_BASE_URL` instead of re-reading `import.meta.env` |
| `front/src/contexts/AuthContext.jsx` | `register()` returns a boolean and fires one alert instead of two |
| `front/src/components/authentication/Login.jsx` | Reads `loadingAuth`, not the non-existent `loading` |
| `front/src/components/authentication/Register.jsx` | Reads `loadingAuth`; availability check goes through the axios client instead of bare `fetch` |
| `front/src/components/users/Profile.jsx` | Deleted — unreferenced, and imports a module that does not exist |
| `front/src/pages/Users.jsx` | Deleted — empty file, unreferenced |
| `front/package.json` | `axios` moves to `^1.7.9`; lint scripts updated for ESLint 9 |
| `front/eslint.config.js` | New — the same rule set as `.eslintrc.js`, in the format ESLint 9 reads |

**Created — repository root**

| File | Responsibility |
|---|---|
| `ruff.toml` | ruff lint and format configuration for `back/` |
| `.git-blame-ignore-revs` | Lists the formatting sweep commit so `git blame` skips it |

---

## Survey findings this plan acts on

Recorded here so the tasks below can refer to them by name. Each was read in the source, not inferred from the framework.

**Security (fixed TDD-style, per Spec D8 — never characterized):**

1. `back/api/views.py:93` — `UserViewSet.permission_classes = []`. The viewset is a `ReadOnlyModelViewSet` over `User.objects.all()`, so `GET /api/users/` returns every user's `id`, `username` and `email` to an unauthenticated caller. `GET /api/users/<id>/` and `GET /api/users/me/` are equally open. Fixed by Task 7.
2. `back/api/serializers.py:260` + `back/api/models.py:100` — `ReportSerializer.Meta.fields = '__all__'` makes `Report.user` writable, and `front/src/components/reports/ReportModal.jsx:44` supplies it from the client. Any authenticated caller can attribute a report to any other user. Fixed by Task 8.
3. `back/api/serializers.py:64-70` — `UserSerializer.create()` calls `User.objects.create_user()` directly. `AUTH_PASSWORD_VALIDATORS` is configured (`back/backend/settings.py:153`) but Django applies it only through the auth forms, so registration accepts a one-character password. The frontend's own length, uppercase, digit and symbol checks are commented out at `front/src/utils/validation.js:52-60`. Fixed by Task 9.

**Not found — stated explicitly rather than invented:**

- No serializer exposes a password hash. `UserSerializer` declares `extra_kwargs = {'password': {'write_only': True}}` (`back/api/serializers.py:62`), and no other serializer touches the `User` model.
- No serializer exposes a JWT, refresh token or `jti`. Tokens are only ever minted in `LoginView` (`back/api/views.py:77-82`).
- No object-level permission check is commented out or missing-but-implied. The domain has no per-user ownership of owners, vehicles, reports or inventory: every authenticated user is a workshop employee with full access, which is the product's intent. `UserProfileViewSet.get_queryset()` (`back/api/views.py:124-126`) is the one ownership filter that exists, and it is correct.
- `DEBUG` is parsed safely and defaults to `False` (`back/backend/settings.py:66`). `SECRET_KEY` comes from a Docker secret file with an environment fallback for CI (`back/backend/settings.py:27-51`); it is never hard-coded. `ALLOWED_HOSTS` defaults to the empty list, which fails closed.

**Correctness and configuration defects (ordinary bugs, characterized or fixed as noted):**

4. `back/backend/settings.py:69` — `CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS').split(',')`. If the variable is unset this raises `AttributeError: 'NoneType' object has no attribute 'split'` at import, so the project cannot even start. Every other variable in the file is read defensively. Fixed by Task 10.
5. `back/backend/settings.py:51-56` — `load_dotenv()` runs *after* the three `read_secret()` calls, so `back/.env` cannot supply `DJANGO_SECRET_KEY`, `MYSQL_USER` or `MYSQL_PASSWORD`. This contradicts `back/.env.example` and the README's local-development instructions. Fixed by Task 10.
6. `back/backend/settings.py:261-263` — `CORS_ORIGIN_WHITELIST` is the pre-3.0 name for this setting. django-cors-headers 4.6.0 ignores it entirely; it is dead configuration that reads as if it were live. Removed by Task 10.
7. `back/api/views.py:362` — `InvoiceViewSet.queryset = Invoice.objects.all()` while `InvoiceSerializer` reads `obj.report.vehicle.owner.full_name`, `obj.report.vehicle.license_plate` and the `Invoice.total_cost` property, which itself walks `report.task_set` → `task.task_template` and `report.part_set` → `part.part` (`back/api/models.py:234-246`). Listing invoices is O(n) queries in invoices and O(n) again in their tasks and parts. Fixed by Task 11.
8. `back/api/views.py:210` — `ReportViewSet.queryset` has `select_related('vehicle')` but no `prefetch_related`, while `ReportSerializer` serializes `task_set` and `part_set` for every row (`back/api/serializers.py:255-256`). Fixed by Task 11.
9. `back/api/views.py` — the same eight-line `update()` override appears six times: byte-identical in `OwnerViewSet`, `VehicleViewSet`, `TaskTemplateViewSet`, `InventoryViewSet` and `InvoiceViewSet`, and with four extra lines of invoice generation in `ReportViewSet`. DRF's built-in `UpdateModelMixin.update` produces the same status codes and the same body as the five identical copies. Removed by Task 12.
10. `back/api/views.py` — the same fourteen-line `list()` override appears three times (Report, Inventory, Invoice), differing only in the default ordering, and it mutates `self.pagination_class` as a side effect. Collapsed by Task 12.
11. `back/api/serializers.py` — the same eighteen-line `updated_at` concurrency check appears five times (Owner, Vehicle, TaskTemplate, Inventory, Report), differing only in one noun. Collapsed by Task 12.
12. `front/src/utils/axiosInstance.js:14-32` — the 401 handler calls `axiosInstance(config)` to replay the request, and that replay goes through the same interceptor. If the replay also returns 401 the handler recurses without bound. Fixed by Task 13.
13. `front/src/components/users/Profile.jsx:2` imports `'../utils/useAxios'`, which does not exist at that path or any other, and lines 7-10 use `useState` and `useEffect` without importing them. The file is unreferenced, so the bundler never resolves it. Deleted by Task 13.
14. `front/src/pages/Users.jsx` is a zero-byte file. Deleted by Task 13.
15. `front/src/contexts/AuthContext.jsx:119-147` — the registration failure path calls `Swal.fire` at line 124 and again unconditionally at line 142, so a failed registration shows two dialogs. `register()` also returns `undefined`, while `Register.jsx:102` treats its result as a success flag. Fixed by Task 13.
16. `front/src/components/authentication/Login.jsx:14` and `Register.jsx:16` destructure `loading` from `useAuth()`. The context exposes `loadingAuth`; there is no `loading`. The submit button's disabled state and its "Logging in..." label are therefore dead. Fixed by Task 13.
17. `front/src/components/authentication/Register.jsx:35` calls the API with bare `fetch()`, bypassing the only axios client. Moved onto the client by Task 13.
18. `front/src/stores/useUserStore.js:24` — the method that updates a user is named `updateOwner`. Renamed by Task 13.
19. `front/package.json` pins `eslint: ^9.25.1` while the configuration lives in `front/.eslintrc.js`, which ESLint 9 does not read by default, and `npm run lint` passes `--ext`, which ESLint 9 removed. The lint script cannot have run successfully since the ESLint 9 bump. Fixed by Task 15.
20. `README.md:62` tells the reader to run `docker compose -f docker-compose.test.yml up --build`. That file does not exist. `README.md:8` says "React 18"; `front/package.json` pins React 19. Fixed by Task 1.

---

## Phase A — Document

### Task 1: Documentation set and ADRs

**Files:**
- Create: `docs/architecture.md`, `docs/design.md`, `docs/technical.md`, `docs/runbook.md`
- Create: `docs/decisions/0001-settings-split-by-environment.md`, `docs/decisions/0002-permission-baseline.md`, `docs/decisions/0003-secrets-are-read-only.md`, `docs/decisions/0004-jwt-in-localstorage.md`, `docs/decisions/0005-deferred-findings.md`
- Create: `docs/superpowers/specs/2026-08-22-estate-refactor-design.md`
- Move: `docs/Pres1.pdf`, `docs/pres-guide.pdf`, `docs/Projektarbeit - Anwendung dokumentation.pdf` → `docs/reference/`
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `docs/decisions/0005-deferred-findings.md`, appended to by Tasks 10, 12, 13 and 16.

- [ ] **Step 1: Create the branch**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git checkout -b refactor/workshop
```

Expected: `Switched to a new branch 'refactor/workshop'`.

- [ ] **Step 2: Copy the estate spec into the repository**

```bash
mkdir -p docs/superpowers/specs
cp "C:/Users/Maria/AppData/Local/Temp/claude/C--Users-Maria-Desktop-Dev-space-multi/1814e037-1eae-4438-a5b2-96a101fd483d/scratchpad/2026-08-22-estate-refactor-design.md" \
   docs/superpowers/specs/
```

That path is a session scratchpad and is not durable. If the file is gone, ask
for the estate design document before continuing — every constraint in this plan
derives from it, and guessing at them is worse than waiting.

- [ ] **Step 3: Move the existing documentation out of the way without discarding it**

`docs/` currently holds three PDFs and nothing else. They are the original
project write-up and presentation and remain the only prose about the product's
intent, so they are kept, not deleted.

```bash
mkdir -p docs/reference
git mv "docs/Pres1.pdf" docs/reference/
git mv "docs/pres-guide.pdf" docs/reference/
git mv "docs/Projektarbeit - Anwendung dokumentation.pdf" docs/reference/
git status --porcelain docs
```

Expected: three `R` (renamed) entries and nothing else.

- [ ] **Step 4: Write `docs/architecture.md`**

Required sections, in this order: Overview; Components; Request flow; Persistence; Deployment topology.

Facts that must appear, all verified during the survey:

- One Django app, `api`, mounted at `/api/` by `back/backend/urls.py:25`.
- Two function-style auth endpoints — `POST /api/register/` and `POST /api/login/` (`back/api/urls.py:22-23`) — plus SimpleJWT's `POST /api/token/refresh/`.
- Eight router-registered viewsets: `users`, `profile`, `owners`, `vehicles`, `reports`, `task-templates`, `inventory`, `invoices` (`back/api/urls.py:11-18`).
- Authentication is JWT only: `DEFAULT_AUTHENTICATION_CLASSES` lists `rest_framework_simplejwt.authentication.JWTAuthentication` and nothing else. Access tokens live 20 minutes, refresh tokens 1 day, and refresh tokens rotate.
- `DEFAULT_PERMISSION_CLASSES` is `IsAuthenticated`, and every viewset then re-declares `permission_classes` anyway. State that this is why one viewset was able to disable it silently.
- `DEFAULT_PAGINATION_CLASS` is `LimitOffsetPagination` with no page size, so it returns a bare array unless the caller sends `limit` or `offset`. Three viewsets set `pagination_class = None` and hand-roll the same behaviour with a five-item default limit.
- Invoices are generated as a side effect of a report reaching `status == "exported"` (`back/api/views.py:255-257`), and rendered to PDF by WeasyPrint in `back/api/services/invoices.py`.
- The frontend is a Vite build served by `nginxinc/nginx-unprivileged` on port 8080, which also serves `/media/` and `/static_django/` from two volumes shared with the backend container (`nginx/frontend/nginx.conf`).
- traefik terminates TLS and routes `Host(workshop.santoriello.ch)` to the frontend and `Host(...) && PathPrefix(/api)` to the backend on port 8000 (`docker-compose.yml:64,103`).
- The `internal` network is `internal: true`, so MySQL is not reachable from the proxy network.

- [ ] **Step 5: Write `docs/design.md`**

Required sections: Domain model; Report lifecycle; Invoicing; Authentication model; Where the original project documentation lives.

The domain model section documents `User` (custom `AbstractUser` whose
`USERNAME_FIELD` is `email` while `username` stays required and unique),
`UserProfile` (created by a `post_save` signal, `back/api/models.py:250-261`),
`Owner`, `Vehicle` (FK to `Owner`), `Report` (FK to `Vehicle` and to `User`),
`TaskTemplate`, `Task` (joins a `TaskTemplate` to a `Report`), `Inventory`,
`Part` (joins an `Inventory` item to a `Report` and adjusts stock in its `save`
and `delete`, `back/api/models.py:179-217`), and `Invoice` (FK to `Report`, with
`total_cost` computed on read rather than stored — the column was removed in
migration `0009`).

State explicitly that `Report.STATUS_CHOICES` is
`pending / in_progress / completed / exported`, and that reaching `exported`
creates an `Invoice` and writes a PDF.

State explicitly that every authenticated user is a workshop employee with
access to all owners, vehicles, reports and stock: there is no per-user
ownership in this domain, and the only row-level filter in the codebase is
`UserProfileViewSet.get_queryset()`.

The last section points at `docs/reference/` and names each PDF.

- [ ] **Step 6: Write `docs/technical.md`**

Required sections: Prerequisites; Local development; Configuration; Secrets; Running the tests; CI/CD; Formatting.

Configuration must list every environment variable the backend reads, with the
file and line it is read at:

| Variable | Read at | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | `settings.py:51` (env fallback for the `django_secret_key` secret) | Django `SECRET_KEY` |
| `MYSQL_USER` | `settings.py:52` (env fallback for the `mysql_user` secret) | Database user |
| `MYSQL_PASSWORD` | `settings.py:53` (env fallback for the `mysql_password` secret) | Database password |
| `MYSQL_HOST` | `settings.py:22` | Database host |
| `MYSQL_PORT` | `settings.py:141` | Database port |
| `MYSQL_DATABASE` | `settings.py:137` | Database name; the test database is `test_<name>` |
| `DEBUG` | `settings.py:66` | `1`/`true`/`yes` enables debug; anything else disables it |
| `ALLOWED_HOSTS` | `settings.py:68` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `settings.py:69` | Comma-separated; **currently mandatory — see Task 10** |
| `STATIC_ROOT`, `MEDIA_ROOT` | `settings.py:192-193` | Overridable so the suite can run outside a container |
| `SEED_DEMO_DATA` | `back/entrypoint.sh:23` | `true` triggers a one-off `populate_db --all` |
| `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` | `back/entrypoint.sh:18` | Consumed by `createsuperuser --noinput` |

The frontend reads exactly one variable, `VITE_API_URL`, from `front/.env`,
which is committed on purpose because Vite inlines it into the public bundle.

The secrets section records that production reads four Docker secret files from
`/srv/secrets/workshop/` and the remaining environment from
`/srv/secrets/workshop/back.env`, and that `secrets/` in the repository holds
only a README.

The "Running the tests" section reproduces, verbatim, the standard backend test
command from Task 2 Step 3 and the frontend command `npx vitest run`.

- [ ] **Step 7: Write `docs/runbook.md`**

Required sections: Where the logs are; Backing up `mysql_volume`; Restoring; Backend refuses to start; Media and static files are missing; Certificate or hostname problems.

The "backend refuses to start" section must cover the two failure modes the
survey found: `entrypoint.sh` blocks in a `nc -z` loop when MySQL is not
healthy, and settings raise before Django starts if `CORS_ALLOWED_ORIGINS` is
unset or a secret is neither mounted nor present in the environment.

The media/static section must record that `static_volume` and `media_volume` are
mounted read-write into the backend and read-only into the frontend, and that
`collectstatic` runs on every backend start.

The hostname section must record that this project is served at
`workshop.santoriello.ch`, and that traefik answers unmatched hostnames with a
default certificate, which curl reports as exit 60 — a symptom of a missing
router, not of a broken certificate.

- [ ] **Step 8: Write the five ADRs**

`0001-settings-split-by-environment.md` records the decision Task 10 implements:
`backend/settings` becomes a package whose `__init__.py` selects a module from
`DJANGO_ENV`. Consequence: `DJANGO_SETTINGS_MODULE` stays `backend.settings`
everywhere, so `manage.py`, `wsgi.py`, `asgi.py`, `pytest.ini` and
`deploy.yml` are untouched, and production must set `DJANGO_ENV=production`,
which `docker-compose.yml` now does.

`0002-permission-baseline.md` records the decision Task 7 implements: every
viewset declares `permission_classes`, the default is `IsAuthenticated`, and
public access is granted per action through `get_permissions()` rather than by
emptying the list. Context is finding 1 above — quote the two lines of
`views.py` that caused it.

`0003-secrets-are-read-only.md` records what `secrets/README.md` and the
`docker-compose.yml` `secrets:` block describe, and states that this refactor
cycle changes neither. Record the one observation the survey made and did not
act on: `read_secret` falls back to an environment variable before reading the
mounted file, which is what lets CI run, and which also means an environment
variable silently wins over a mounted secret in production.

`0004-jwt-in-localstorage.md` records that the access token is stored at
`localStorage['token']` and the refresh token at `localStorage['refreshToken']`
(`front/src/contexts/AuthContext.jsx:50-51`), that this is readable by any
script running on the origin, and that moving to httpOnly cookies would require
CSRF protection and a backend change that is out of scope for this cycle.

`0005-deferred-findings.md` starts with the items this plan knowingly leaves
alone; Tasks 10, 12, 13 and 16 append to it.

- [ ] **Step 9: Rewrite `README.md` as an entry point**

Keep the CI badge on line 1. State what the project is in two sentences, give
the shortest path to running it locally, and link to each of the four `docs/`
files. Detail lives in `docs/`, not in the README.

Three factual corrections are mandatory:

- Line 8 says "React 18 + JavaScript". `front/package.json` pins `react: ^19.1.0`.
- Lines 57-75 tell the reader to run `docker compose -f docker-compose.test.yml up --build`. No such file exists. Replace with `cd front && npm ci --legacy-peer-deps && npx vitest run`.
- Line 54 tells the reader to run `python manage.py test`. The suite is pytest; `pytest.ini` sets `DJANGO_SETTINGS_MODULE` and `deploy.yml` runs `python -m pytest -q`.

- [ ] **Step 10: Verify no production code changed**

```bash
git status --porcelain
```

Expected: only files under `docs/`, plus `README.md`. If anything under `back/`
or `front/` appears, revert it — this phase changes no code.

- [ ] **Step 11: Commit**

```bash
git add docs README.md
git commit -m "docs: document architecture, design, technical detail and runbook"
```

---

## Phase B — Characterize

Nothing in this phase changes production code. Every assertion below describes
what the API does **today**. Where today's behaviour is a defect, this phase
stays silent and Phase C asserts the corrected behaviour instead (Spec D8).

What the existing suite already covers, and is therefore **not** repeated here:

| Existing module | Already covered |
|---|---|
| `test_auth_api.py` | register 201, login 200 with `access` and `refresh` |
| `test_models.py` | `Part.save` deducts stock, refuses to oversell, `Part.delete` restores stock, `UserProfile` is created by signal |
| `test_owners_api.py` | Owner create / list / retrieve / update / delete |
| `test_reportviewset.py` | Report list, `status` filter, ordering, `limit`/`offset` pagination, invoice generation on export, the `tasks` and `parts` detail actions |
| `test_vehicles_withJWT_api.py` | Vehicle create / list / update / delete with a bearer token |
| `test_vehicles_edgecases.py` | Vehicle missing fields, bad year format, duplicate plate, extreme year |
| `test_vehicles_permissions.py` | Vehicle list and create reject an anonymous caller with 401 |
| `front/src/App.test.jsx` | Routes to Login when anonymous, Dashboard when authenticated, renders a modal from context |
| `front/src/__tests__/stores/UseReportStore.test.jsx` | Report store fetch (paginated) / create / update / delete / error |
| `front/src/__tests__/hooks/useReportModal.test.jsx` | Adding and removing tasks in the report modal hook |
| `front/src/__tests__/pages/Report.test.jsx` | Report page renders from the store |
| `front/src/__tests__/components/ReportModal.test.jsx` | Report modal rendering |

The gaps this phase fills: the permission boundary of every route other than
vehicles, the `updated_at` concurrency contract that five serializers implement,
the inventory / task-template / invoice endpoints, and the axios client and auth
context that Task 14's dependency bump will move under.

### Task 2: Make both suites runnable and add the shared test helpers

**Files:**
- Create: `back/api/tests/helpers.py`
- Test: `back/api/tests/helpers.py` is imported by Tasks 3, 4, 5, 7, 8, 9 and 11

**Interfaces:**
- Consumes: `api.models.User` (via `django.contrib.auth.get_user_model`).
- Produces:
  - `DEFAULT_PASSWORD: str` — a passphrase that satisfies `AUTH_PASSWORD_VALIDATORS`, so it keeps working after Task 9.
  - `make_user(email='tester@example.com', username='tester', password=DEFAULT_PASSWORD) -> User`
  - `authenticate(client, user) -> client` — forces authentication and returns the client.

- [ ] **Step 1: Start a MySQL for the suite**

The backend has no SQLite fallback: `back/backend/settings.py:136` hard-codes
`django.db.backends.mysql`. Use the same image and the same throwaway
credentials CI uses, so a green run locally means a green run in CI.

```bash
docker run -d --name workshop-test-mysql \
  -e MYSQL_ROOT_PASSWORD=ci-root-password \
  -e MYSQL_DATABASE=workshop_db \
  -p 3306:3306 mysql:8.0
```

Wait for it to accept connections:

```bash
docker exec workshop-test-mysql \
  mysqladmin ping -h 127.0.0.1 -uroot -pci-root-password --silent
```

Expected: `mysqld is alive`. Re-run until it reports that; a fresh MySQL 8
container takes roughly 20-40 seconds to initialise.

If port 3306 is already taken, use `-p 3307:3306` and change `MYSQL_PORT=3306`
to `MYSQL_PORT=3307` in **every** backend test command in this plan. Do not
change `pytest.ini` or `deploy.yml`.

- [ ] **Step 2: Install the Python dependencies**

```bash
cd back && python -m pip install -r requirements.txt
```

Expected: installs without error. `mysqlclient` compiles against the MariaDB
development headers; on Debian or Ubuntu install them first with
`sudo apt-get install -y gcc pkg-config libmariadb-dev`.

- [ ] **Step 3: Run the existing suite and record the baseline**

This is the standard backend test command. It is repeated verbatim in every
later step that runs the backend suite, because the shell does not persist
between steps.

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS. Write down the exact number of tests reported — it goes in the
handover in Task 16, and every later step compares against it.

The environment variables are not decoration. `DJANGO_SECRET_KEY`,
`MYSQL_USER` and `MYSQL_PASSWORD` are the environment fallbacks that
`read_secret` consults before looking for `/run/secrets/...`; without them
settings raises at import. `CORS_ALLOWED_ORIGINS` is read with a bare
`.split(',')` on the result of `os.getenv`, so an unset value raises
`AttributeError` before Django starts — that is finding 4, and Task 10 fixes it.
`STATIC_ROOT` and `MEDIA_ROOT` default to `/backend/...`, which only exists
inside the image.

If the run fails to connect, confirm the container is up with
`docker ps --filter name=workshop-test-mysql`. Do not "fix" it by editing
settings — the settings are what production uses.

- [ ] **Step 4: Run the frontend suite and record the baseline**

```bash
cd front && npm ci --legacy-peer-deps && npx vitest run
```

Expected: PASS. Write down the number of test files and tests.

`--legacy-peer-deps` is required: this tree has peer conflicts that npm 7+
treats as fatal, and `front/Dockerfile:12` and `deploy.yml:72` both pass it.

- [ ] **Step 5: Write the shared helpers**

Create `back/api/tests/helpers.py`:

```python
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
```

- [ ] **Step 6: Confirm the helpers import cleanly**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q --collect-only
```

Expected: the same collection count as Step 3 (`helpers.py` defines no tests, so
it adds none) and no collection errors.

- [ ] **Step 7: Commit**

```bash
git add back/api/tests/helpers.py
git commit -m "test: add shared helpers for the API suite"
```

### Task 3: Characterize the permission boundary of every route

**Files:**
- Create: `back/api/tests/test_permissions_matrix.py`
- Test: the file above

**Interfaces:**
- Consumes: `make_user`, `authenticate`, `DEFAULT_PASSWORD` from `api.tests.helpers` (Task 2).
- Produces: the record of which routes are public, which Tasks 7 and 10 must not widen.

- [ ] **Step 1: Write the test**

Create `back/api/tests/test_permissions_matrix.py`:

```python
"""
Characterization tests for the permission boundary of every registered route.

These assert what the API does today so the refactor can be shown not to change
it. One group of routes is deliberately absent: /api/users/. Those are reachable
without credentials today, which is a defect, so per spec decision D8 they are
not pinned here - Task 7 asserts the corrected behaviour in test_users_api.py
instead. Pinning them would make the deploy gate defend the hole.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.tests.helpers import DEFAULT_PASSWORD, authenticate, make_user


class AnonymousAccessTests(APITestCase):
    """Every business route rejects a caller carrying no credentials."""

    def test_owner_list_rejects_anonymous(self):
        response = self.client.get(reverse("owner-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_vehicle_list_rejects_anonymous(self):
        response = self.client.get(reverse("vehicle-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_list_rejects_anonymous(self):
        response = self.client.get(reverse("report-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_task_template_list_rejects_anonymous(self):
        response = self.client.get(reverse("task-template-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inventory_list_rejects_anonymous(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invoice_list_rejects_anonymous(self):
        response = self.client.get(reverse("invoice-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_list_rejects_anonymous(self):
        response = self.client.get(reverse("userprofile-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_create_rejects_anonymous(self):
        response = self.client.post(
            reverse("owner-list"),
            {"first_name": "Nope", "last_name": "Nope"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PublicRouteTests(APITestCase):
    """The routes that are public on purpose stay public."""

    def test_register_is_public(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "publicuser",
                "email": "publicuser@example.com",
                "password": DEFAULT_PASSWORD,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_rejects_a_duplicate_email(self):
        make_user(email="dupe@example.com", username="dupe1")
        response = self.client.post(
            reverse("register"),
            {
                "username": "dupe2",
                "email": "dupe@example.com",
                "password": DEFAULT_PASSWORD,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_is_public_and_rejects_a_wrong_password(self):
        make_user(email="login@example.com", username="loginuser")
        response = self.client.post(
            reverse("login"),
            {"email": "login@example.com", "password": "definitely-not-it"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_both_tokens_and_the_user(self):
        make_user(email="login2@example.com", username="loginuser2")
        response = self.client.post(
            reverse("login"),
            {"email": "login2@example.com", "password": DEFAULT_PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "login2@example.com")
        self.assertNotIn("password", response.data["user"])

    def test_token_refresh_rejects_a_garbage_token(self):
        response = self.client.post(
            reverse("token_refresh"), {"refresh": "not-a-token"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthenticatedAccessTests(APITestCase):
    """An authenticated caller reaches every business route."""

    def setUp(self):
        self.user = make_user(email="employee@example.com", username="employee")
        authenticate(self.client, self.user)

    def test_authenticated_caller_reaches_every_list_route(self):
        for url_name in (
            "owner-list",
            "vehicle-list",
            "report-list",
            "task-template-list",
            "inventory-list",
            "invoice-list",
            "userprofile-list",
        ):
            with self.subTest(route=url_name):
                response = self.client.get(reverse(url_name))
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_profile_list_shows_only_the_callers_own_profile(self):
        make_user(email="other@example.com", username="other")
        response = self.client.get(reverse("userprofile-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
```

- [ ] **Step 2: Run it**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_permissions_matrix.py
```

Expected: 15 passed. These characterize existing behaviour, so passing on the
first run is the correct outcome — it confirms the harness works and the
assertions match reality.

Two assertions are worth watching:

- `test_token_refresh_rejects_a_garbage_token` — SimpleJWT raises `InvalidToken`, which DRF renders as 401. If it reports 400, change the assertion to `HTTP_400_BAD_REQUEST` and note it in `docs/decisions/0005-deferred-findings.md`. This is a characterization test; reality wins.
- `test_profile_list_shows_only_the_callers_own_profile` asserts `len(response.data) == 1`. `UserProfileViewSet` does not set `pagination_class = None`, so it inherits `LimitOffsetPagination` — which returns a bare list when the caller sends no `limit`. If this fails with a `count` key in the body, the response is paginated; change the assertion to `len(response.data["results"]) == 1` and record the surprise.

- [ ] **Step 3: Commit**

```bash
git add back/api/tests/test_permissions_matrix.py
git commit -m "test: pin which routes are reachable without credentials"
```

### Task 4: Characterize the `updated_at` concurrency contract

**Files:**
- Create: `back/api/tests/test_concurrency_api.py`
- Test: the file above

**Interfaces:**
- Consumes: `make_user`, `authenticate` from `api.tests.helpers` (Task 2).
- Produces: the 400/409/200 contract that Task 12's `ConcurrencyCheckMixin` must preserve exactly.

- [ ] **Step 1: Read the check being pinned**

```bash
cd back && grep -n "updated_at" api/serializers.py
```

Expected: five near-identical blocks, in `OwnerSerializer`, `VehicleSerializer`,
`TaskTemplateSerializer`, `InventorySerializer` and `ReportSerializer`. Each
reads `self.initial_data["updated_at"]`, parses it with `isoparse`, and compares
it to `self.instance.updated_at` with a tolerance of one microsecond. A mismatch
raises `ConflictException` (`api/exceptions.py`), whose `status_code` is 409.

- [ ] **Step 2: Write the test**

Create `back/api/tests/test_concurrency_api.py`:

```python
"""
Characterization tests for the optimistic-concurrency contract.

Five serializers implement the same check: an update must echo back the
`updated_at` the client last read. Missing it is a 400, a stale one is a 409, a
matching one is a 200. Task 12 collapses those five copies into one mixin, and
these tests are what proves the collapse changed nothing.
"""

from datetime import timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Inventory, Owner, TaskTemplate, Vehicle
from api.tests.helpers import authenticate, make_user


class ConcurrencyContractTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="employee@example.com", username="employee")
        authenticate(self.client, self.user)

        self.owner = Owner.objects.create(
            first_name="Jane", last_name="Smith", email="jane@example.com"
        )
        self.vehicle = Vehicle.objects.create(
            owner=self.owner,
            brand="Audi",
            model="A3",
            year=2015,
            license_plate="CONC-1",
        )
        self.template = TaskTemplate.objects.create(name="Oil change", price=50)
        self.item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=20,
            unit_price=15,
        )

    # ---- owners ----

    def test_owner_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_update_with_a_stale_updated_at_conflicts(self):
        stale = self.owner.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_owner_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": self.owner.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.owner.refresh_from_db()
        self.assertEqual(self.owner.first_name, "Janet")

    # ---- vehicles ----

    def test_vehicle_update_without_updated_at_is_rejected(self):
        response = self.client.patch(
            reverse("vehicle-detail", kwargs={"pk": self.vehicle.pk}),
            {"brand": "BMW"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vehicle_update_with_a_stale_updated_at_conflicts(self):
        stale = self.vehicle.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("vehicle-detail", kwargs={"pk": self.vehicle.pk}),
            {"brand": "BMW", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    # ---- task templates ----

    def test_task_template_update_with_a_stale_updated_at_conflicts(self):
        stale = self.template.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("task-template-detail", kwargs={"pk": self.template.pk}),
            {"name": "Oil change plus", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_task_template_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("task-template-detail", kwargs={"pk": self.template.pk}),
            {"name": "Oil change plus", "updated_at": self.template.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ---- inventory ----

    def test_inventory_update_with_a_stale_updated_at_conflicts(self):
        stale = self.item.updated_at - timedelta(seconds=5)
        response = self.client.patch(
            reverse("inventory-detail", kwargs={"pk": self.item.pk}),
            {"name": "Oil filter XL", "updated_at": stale},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_inventory_update_with_the_current_updated_at_succeeds(self):
        response = self.client.patch(
            reverse("inventory-detail", kwargs={"pk": self.item.pk}),
            {"name": "Oil filter XL", "updated_at": self.item.updated_at},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ---- malformed input ----

    def test_an_unparseable_updated_at_is_a_400_not_a_500(self):
        response = self.client.patch(
            reverse("owner-detail", kwargs={"pk": self.owner.pk}),
            {"first_name": "Janet", "updated_at": "yesterday"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- creation is exempt ----

    def test_creating_an_owner_needs_no_updated_at(self):
        response = self.client.post(
            reverse("owner-list"),
            {
                "first_name": "New",
                "last_name": "Owner",
                "email": "new.owner@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

Note what this file deliberately does not assert: the body of the 409. The
message differs per serializer today (`"This owner has been..."`,
`"This vehicle has been..."`), and Task 12 preserves those nouns, but pinning
the prose would make the mixin's `conflict_noun` untouchable for no benefit.

- [ ] **Step 3: Run it**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_concurrency_api.py
```

Expected: 11 passed.

If a `..._with_the_current_updated_at_succeeds` test reports 409, the client and
server timestamps differ by more than a microsecond. Check the column type:

```bash
docker exec workshop-test-mysql mysql -uroot -pci-root-password \
  -e "DESCRIBE test_workshop_db.api_owner;"
```

`datetime(6)` is correct. If it is plain `datetime`, that is a real finding
about the schema: record it in `docs/decisions/0005-deferred-findings.md` and
widen the assertion to accept 409, because the characterization must describe
reality.

- [ ] **Step 4: Commit**

```bash
git add back/api/tests/test_concurrency_api.py
git commit -m "test: pin the updated_at concurrency contract"
```

### Task 5: Characterize inventory, task templates and invoices

**Files:**
- Create: `back/api/tests/test_catalog_api.py`
- Test: the file above

**Interfaces:**
- Consumes: `make_user`, `authenticate` from `api.tests.helpers` (Task 2).
- Produces: the response-shape contract (bare array vs `{count, next, previous, results}`) that Task 12's `OptionalPaginationMixin` must preserve, and the `total_cost` number that Task 11 must not change.

- [ ] **Step 1: Write the test**

Create `back/api/tests/test_catalog_api.py`:

```python
"""
Characterization tests for the inventory, task-template and invoice endpoints.

Three viewsets set `pagination_class = None` and then hand-roll pagination in
`list()`: they return a bare array unless the caller sends `limit` or `offset`,
in which case they return the LimitOffsetPagination envelope with a default page
of five. Task 12 collapses those three copies into one mixin; these tests are
what proves the collapse changed nothing.
"""

from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import (
    Inventory,
    Invoice,
    Owner,
    Part,
    Report,
    Task,
    TaskTemplate,
    Vehicle,
)
from api.tests.helpers import authenticate, make_user


class InventoryEndpointTests(APITestCase):
    def setUp(self):
        authenticate(self.client, make_user(email="e@example.com", username="e"))
        for index in range(7):
            Inventory.objects.create(
                name=f"Item {index}",
                reference_code=f"REF-{index}",
                category="filters",
                quantity_in_stock=Decimal("10.00"),
                unit_price=Decimal("5.00"),
            )

    def test_list_returns_a_bare_array_by_default(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 7)

    def test_list_is_ordered_by_name_by_default(self):
        response = self.client.get(reverse("inventory-list"))
        names = [row["name"] for row in response.data]
        self.assertEqual(names, sorted(names))

    def test_limit_switches_the_response_to_the_pagination_envelope(self):
        response = self.client.get(reverse("inventory-list") + "?limit=3")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 7)
        self.assertEqual(len(response.data["results"]), 3)

    def test_offset_alone_uses_the_five_item_default_page(self):
        response = self.client.get(reverse("inventory-list") + "?offset=0")
        self.assertEqual(len(response.data["results"]), 5)

    def test_rows_carry_the_formatted_timestamps(self):
        response = self.client.get(reverse("inventory-list"))
        self.assertIn("formatted_created_at", response.data[0])
        self.assertIn("formatted_updated_at", response.data[0])

    def test_creating_an_item_returns_201(self):
        response = self.client.post(
            reverse("inventory-list"),
            {
                "name": "Brake pad",
                "reference_code": "REF-BP",
                "category": "brakes",
                "quantity_in_stock": "4.00",
                "unit_price": "40.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_a_duplicate_reference_code_is_rejected(self):
        response = self.client.post(
            reverse("inventory-list"),
            {
                "name": "Clash",
                "reference_code": "REF-0",
                "quantity_in_stock": "1.00",
                "unit_price": "1.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TaskTemplateEndpointTests(APITestCase):
    def setUp(self):
        authenticate(self.client, make_user(email="e@example.com", username="e"))
        TaskTemplate.objects.create(name="Brakes", description="Replace pads", price=200)
        TaskTemplate.objects.create(name="Alignment", description="Four wheel", price=90)

    def test_list_returns_a_bare_array(self):
        response = self.client.get(reverse("task-template-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_filtering_by_name_narrows_the_list(self):
        response = self.client.get(reverse("task-template-list") + "?name=Brakes")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Brakes")

    def test_ordering_by_name_is_supported(self):
        response = self.client.get(reverse("task-template-list") + "?ordering=name")
        self.assertEqual([row["name"] for row in response.data], ["Alignment", "Brakes"])

    def test_creating_a_template_returns_201(self):
        response = self.client.post(
            reverse("task-template-list"),
            {"name": "Tyres", "description": "Swap set", "price": "320.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class InvoiceEndpointTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="e@example.com", username="e")
        authenticate(self.client, self.user)

        owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        vehicle = Vehicle.objects.create(
            owner=owner, brand="Audi", model="A3", year=2015, license_plate="INV-1"
        )
        self.report = Report.objects.create(
            vehicle=vehicle, user=self.user, status="completed"
        )
        template = TaskTemplate.objects.create(name="Oil change", price=Decimal("50.00"))
        Task.objects.create(report=self.report, task_template=template)
        item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=Decimal("20.00"),
            unit_price=Decimal("15.00"),
        )
        Part.objects.create(report=self.report, part=item, quantity_used=Decimal("2.00"))
        # Created directly rather than by exporting the report: this test is
        # about the read contract, and rendering the PDF is slow and already
        # covered by test_reportviewset.test_update_triggers_invoice.
        self.invoice = Invoice.objects.create(
            invoice_number="INV-000001", report=self.report
        )

    def test_list_returns_a_bare_array(self):
        response = self.client.get(reverse("invoice-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)

    def test_a_row_carries_the_derived_customer_fields(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertEqual(row["owner_full_name"], "Ada Lovelace")
        self.assertEqual(row["vehicle_plate"], "INV-1")

    def test_total_cost_is_computed_from_tasks_and_parts(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        # one task at 50.00 plus two parts at 15.00 each, with no VAT
        self.assertEqual(Decimal(str(row["total_cost"])), Decimal("80.00"))

    def test_pdf_exists_is_false_when_no_file_was_written(self):
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertFalse(row["pdf_exists"])

    def test_filtering_by_invoice_number_narrows_the_list(self):
        response = self.client.get(reverse("invoice-list") + "?invoice_number=INV-000001")
        self.assertEqual(len(response.data), 1)

    def test_limit_switches_the_response_to_the_pagination_envelope(self):
        response = self.client.get(reverse("invoice-list") + "?limit=1")
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 1)
```

- [ ] **Step 2: Run it**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_catalog_api.py
```

Expected: 17 passed.

If `test_total_cost_is_computed_from_tasks_and_parts` reports a different
number, read `Invoice.total_cost` in `api/models.py` before touching the test.
It sums `task.task_template.price` over `report.task_set` and
`part.quantity_used * part.part.unit_price` over `report.part_set`, with no VAT —
VAT is applied only inside the PDF renderer (`api/services/invoices.py:29`).
Correct the expected number to what the property actually computes; the point of
this test is to lock the number so Task 11's query change cannot alter it.

- [ ] **Step 3: Run the whole backend suite**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS, at the Task 2 Step 3 baseline plus 43 new tests (15 + 11 + 17).

- [ ] **Step 4: Commit**

```bash
git add back/api/tests/test_catalog_api.py
git commit -m "test: characterize the inventory, task-template and invoice endpoints"
```

### Task 6: Frontend characterization — the axios client, the auth context and the stores

This task is the gate for Spec D5. The axios bump in Task 14 is not permitted
until every test written here is green.

**Files:**
- Create: `front/src/__tests__/utils/axiosInstance.test.js`
- Create: `front/src/__tests__/contexts/AuthContext.test.jsx`
- Create: `front/src/__tests__/stores/stores.contract.test.js`
- Test: the three files above

**Interfaces:**
- Consumes: `axiosInstance` (default export) and `setAxiosToken` from `src/utils/axiosInstance.js`; `refreshToken` and `logout` from `src/utils/authUtils.js`; `AuthProvider` and `useAuth` from `src/contexts/AuthContext.jsx`; `useOwnerStore` and `useInventoryStore`.
- Produces: `authHeader(config)` — a local helper, defined inside `axiosInstance.test.js`, that reads the `Authorization` header from a request config under both axios 0.x (plain object) and axios 1.x (`AxiosHeaders`). Task 14 depends on it working under both.

- [ ] **Step 1: Write the axios client spec**

Create `front/src/__tests__/utils/axiosInstance.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// authUtils is mocked because the real refreshToken performs a network call and
// imports back into axiosInstance, which would be a cycle in the test graph.
vi.mock('../../utils/authUtils', () => ({
  refreshToken: vi.fn(),
  logout: vi.fn(),
}))

import axiosInstance, { setAxiosToken } from '../../utils/axiosInstance'
import { refreshToken, logout } from '../../utils/authUtils'

/**
 * Reads the Authorization header from a request config. axios 0.x hands the
 * adapter a plain object; axios 1.x hands it an AxiosHeaders instance. This
 * helper works with both, so these assertions survive Task 14 unchanged.
 */
const authHeader = (config) =>
  typeof config.headers?.get === 'function'
    ? config.headers.get('Authorization')
    : config.headers?.Authorization

describe('axiosInstance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete axiosInstance.defaults.headers.common['Authorization']
  })

  it('sends every request to VITE_API_URL', () => {
    expect(axiosInstance.defaults.baseURL).toBe(import.meta.env.VITE_API_URL)
  })

  it('attaches the token given to setAxiosToken as a bearer credential', async () => {
    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    setAxiosToken('first-token')
    await axiosInstance.get('/owners/')

    expect(seen).toHaveLength(1)
    expect(authHeader(seen[0])).toBe('Bearer first-token')
  })

  it('sends no Authorization header before a token is set', async () => {
    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    }

    await axiosInstance.get('/owners/')

    expect(authHeader(seen[0])).toBeFalsy()
  })

  it('refreshes the token and replays the request after a 401', async () => {
    refreshToken.mockResolvedValue('fresh-token')

    const seen = []
    axiosInstance.defaults.adapter = async (config) => {
      seen.push(config)
      if (seen.length === 1) {
        return Promise.reject({ response: { status: 401 }, config })
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }
    }

    const response = await axiosInstance.get('/owners/')

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(seen).toHaveLength(2)
    expect(authHeader(seen[1])).toBe('Bearer fresh-token')
    expect(response.data).toEqual({ ok: true })
    expect(logout).not.toHaveBeenCalled()
  })

  it('logs out and rejects when the refresh fails', async () => {
    refreshToken.mockResolvedValue(null)
    axiosInstance.defaults.adapter = async (config) =>
      Promise.reject({ response: { status: 401 }, config })

    await expect(axiosInstance.get('/owners/')).rejects.toBeTruthy()

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('passes a non-401 failure straight through without refreshing', async () => {
    axiosInstance.defaults.adapter = async (config) =>
      Promise.reject({ response: { status: 500 }, config })

    await expect(axiosInstance.get('/owners/')).rejects.toBeTruthy()

    expect(refreshToken).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })
})
```

`defaults.adapter` is a documented axios configuration option in both 0.27 and
1.x, which is why these tests reach the interceptor without a network and
without adding a dependency.

- [ ] **Step 2: Write the auth context spec**

Create `front/src/__tests__/contexts/AuthContext.test.jsx`:

```jsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const navigateSpy = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateSpy }
})

vi.mock('sweetalert2', () => ({
  __esModule: true,
  default: { fire: vi.fn(), mixin: () => ({ fire: vi.fn() }) },
}))

vi.mock('../../utils/axiosInstance', () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
  setAxiosToken: vi.fn(),
  API_BASE_URL: 'http://test.invalid/api',
}))

import axiosInstance from '../../utils/axiosInstance'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const Probe = () => {
  const { authenticatedUser, loadingAuth, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="user">
        {authenticatedUser ? authenticatedUser.username : 'anonymous'}
      </span>
      <span data-testid="loading">{String(loadingAuth)}</span>
      <button onClick={() => login('ada@example.com', 'pw')}>do-login</button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('starts anonymous when localStorage holds no token', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(axiosInstance.get).not.toHaveBeenCalled()
  })

  it('hydrates the current user from /users/me/ when a token is stored', async () => {
    localStorage.setItem('token', 'stored-token')
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    expect(axiosInstance.get).toHaveBeenCalledWith('/users/me/', expect.anything())
  })

  it('stores both tokens on login and then loads the profile', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { access: 'access-token', refresh: 'refresh-token' },
    })
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByText('do-login'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    expect(localStorage.getItem('token')).toBe('access-token')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token')
    expect(axiosInstance.post).toHaveBeenCalledWith('/login/', {
      email: 'ada@example.com',
      password: 'pw',
    })
  })

  it('clears both tokens and navigates to /login on logout', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('refreshToken', 'stored-refresh')
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'ada', email: 'ada@example.com' },
    })

    renderProbe()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'))
    await userEvent.click(screen.getByText('do-logout'))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(navigateSpy).toHaveBeenCalledWith('/login')
  })
})
```

The mock of `../../utils/axiosInstance` declares `API_BASE_URL` even though the
current module does not export it. `vi.mock` replaces the whole module, so the
extra key is inert today and is exactly what Task 13 will need.

- [ ] **Step 3: Write the store contract spec**

Create `front/src/__tests__/stores/stores.contract.test.js`:

```js
import { act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/axiosInstance')

import axiosInstance from '../../utils/axiosInstance'
import useOwnerStore from '../../stores/useOwnerStore'
import useInventoryStore from '../../stores/useInventoryStore'

describe('useOwnerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOwnerStore.setState({ owners: [], loading: false, error: null })
  })

  it('stores the response body verbatim, because owners are never paginated', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 1, first_name: 'Ada' }] })

    await act(async () => {
      await useOwnerStore.getState().fetchOwners()
    })

    expect(useOwnerStore.getState().owners).toHaveLength(1)
    expect(useOwnerStore.getState().loading).toBe(false)
  })

  it('appends the ordering parameter to the query string', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] })

    await act(async () => {
      await useOwnerStore.getState().fetchOwners({}, 'full_name')
    })

    expect(axiosInstance.get).toHaveBeenCalledWith('/owners/?ordering=full_name')
  })

  it('records the error message and stops loading on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('boom'))

    await act(async () => {
      await useOwnerStore.getState().fetchOwners()
    })

    expect(useOwnerStore.getState().error).toBe('boom')
    expect(useOwnerStore.getState().loading).toBe(false)
  })
})

describe('useInventoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useInventoryStore.setState({
      inventory: [],
      pagination: null,
      loading: false,
      error: null,
    })
  })

  it('unwraps the pagination envelope when the API returns one', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { count: 9, next: 'n', previous: null, results: [{ id: 1 }] },
    })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory({ limit: 1 })
    })

    const state = useInventoryStore.getState()
    expect(state.inventory).toHaveLength(1)
    expect(state.pagination).toEqual({ count: 9, next: 'n', previous: null })
  })

  it('leaves pagination null when the API returns a bare array', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory()
    })

    const state = useInventoryStore.getState()
    expect(state.inventory).toHaveLength(2)
    expect(state.pagination).toBeNull()
  })

  it('drops null and undefined parameters from the query string', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] })

    await act(async () => {
      await useInventoryStore.getState().fetchInventory({ name: 'Oil', category: null })
    })

    expect(axiosInstance.get).toHaveBeenCalledWith('/inventory/?name=Oil')
  })
})
```

- [ ] **Step 4: Run the frontend suite**

```bash
cd front && npx vitest run
```

Expected: PASS — the four pre-existing files plus the three added here.

Any spec that fails is telling you the real behaviour differs from the
assumption in the code above. Read the source, correct the assertion to match
what the code does today, and note the surprise in
`docs/decisions/0005-deferred-findings.md`. Two to watch:

- `appends the ordering parameter` asserts the exact URL `'/owners/?ordering=full_name'`. `useOwnerStore.fetchOwners` builds it with `new URLSearchParams({})` and then `append`, so an empty params object yields exactly that string. If a stray `&` differs, correct the expected string — do not change the store.
- `hydrates the current user from /users/me/` asserts `axiosInstance.get` was called with two arguments. `AuthContext.fetchUserData` passes an explicit `headers` object as the second, which is redundant given `setAxiosToken`, but it is current behaviour and this test pins it.

- [ ] **Step 5: Commit**

```bash
git add front/src/__tests__/utils/axiosInstance.test.js \
        front/src/__tests__/contexts/AuthContext.test.jsx \
        front/src/__tests__/stores/stores.contract.test.js
git commit -m "test: characterize the axios client, the auth context and the stores"
```

---

## Phase C — Refactor

**Do not start this phase until Tasks 2 to 6 are committed and both suites are
green.** Re-run them now if you are unsure. A sweep or a dependency bump applied
on top of a red suite makes it impossible to tell breakage from intent.

Task order in this phase is a dependency order, not a preference:

- The three security fixes (7, 8, 9) come first because they change observable API behaviour, and every later task must run against the corrected behaviour rather than have to re-establish it.
- The settings split (10) comes before the query work (11) because it fixes the `CORS_ALLOWED_ORIGINS` crash that makes every environment fragile, and because `check --deploy` is easier to reason about before the viewsets move.
- The mixin extraction (12) comes after the query work (11) so the two changes to `views.py` do not overlap in the same review diff.
- The axios bump (14) comes after both the frontend characterization suite (6) and the frontend consolidation (13), per Spec D5.
- The formatter sweep (15) is last, because running it earlier would mix reformatting into every review diff above.

### Task 7: Security — close the unauthenticated user listing

A security fix, so it asserts the **corrected** behaviour rather than current
behaviour (Spec D8). Current behaviour is the defect.

**Files:**
- Create: `back/api/tests/test_users_api.py`
- Modify: `back/api/views.py`
- Modify: `docs/decisions/0002-permission-baseline.md`

**Interfaces:**
- Consumes: `make_user`, `authenticate`, `DEFAULT_PASSWORD` from `api.tests.helpers` (Task 2).
- Produces: `UserViewSet.get_permissions()` — grants `AllowAny` for `self.action == "check_availability"` and `IsAuthenticated` otherwise. Task 13 relies on `check_availability` staying public.

- [ ] **Step 1: Read the defect**

```bash
cd back && sed -n '84,113p' api/views.py
```

Expected: `UserViewSet` declares `permission_classes = []` over
`queryset = User.objects.all()`. An empty list means DRF checks nothing — not
that it falls back to `DEFAULT_PERMISSION_CLASSES`. So `GET /api/users/`,
`GET /api/users/<id>/` and `GET /api/users/me/` are all reachable with no
credentials, and the list returns every user's `id`, `username` and `email`.

- [ ] **Step 2: Write the failing test**

Create `back/api/tests/test_users_api.py`:

```python
"""
Security tests for the user endpoints.

Per spec decision D8 these assert the CORRECTED behaviour, not the current
behaviour. UserViewSet ships with `permission_classes = []`, which makes the
whole user table readable by anyone who can reach the API. Characterizing that
would make the deploy gate defend it, so these tests fail first and Task 7 makes
them pass.

check_availability stays public on purpose: the registration form calls it
before the visitor has any credentials.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.tests.helpers import DEFAULT_PASSWORD, authenticate, make_user


class AnonymousUserEndpointTests(APITestCase):
    def setUp(self):
        make_user(email="ada@example.com", username="ada")

    def test_user_list_rejects_anonymous(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_detail_rejects_anonymous(self):
        user = make_user(email="grace@example.com", username="grace")
        response = self.client.get(reverse("user-detail", kwargs={"pk": user.pk}))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_rejects_anonymous(self):
        response = self.client.get(reverse("user-me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_response_body_leaks_an_email_to_an_anonymous_caller(self):
        for url in (reverse("user-list"), reverse("user-me")):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertNotIn("ada@example.com", response.content.decode())

    def test_check_availability_stays_public(self):
        response = self.client.get(
            reverse("user-check-availability") + "?username=ada"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["username_taken"])

    def test_check_availability_reports_a_free_email(self):
        response = self.client.get(
            reverse("user-check-availability") + "?email=nobody@example.com"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["email_taken"])


class AuthenticatedUserEndpointTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="ada@example.com", username="ada")
        authenticate(self.client, self.user)

    def test_user_list_is_readable_by_an_authenticated_caller(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_no_row_carries_a_password(self):
        response = self.client.get(reverse("user-list"))
        rows = response.data["results"] if isinstance(response.data, dict) else response.data
        for row in rows:
            with self.subTest(user=row["username"]):
                self.assertNotIn("password", row)

    def test_me_returns_the_caller(self):
        response = self.client.get(reverse("user-me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["email"], "ada@example.com")
        self.assertNotIn("password", response.data)

    def test_the_endpoint_is_read_only(self):
        response = self.client.delete(
            reverse("user-detail", kwargs={"pk": self.user.pk})
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_users_api.py
```

Expected: **FAIL**. `test_user_list_rejects_anonymous` and
`test_user_detail_rejects_anonymous` report 200 instead of 401, and
`test_no_response_body_leaks_an_email_to_an_anonymous_caller` finds
`ada@example.com` in the anonymous list response.

`test_me_rejects_anonymous` may report 500 rather than 200: `me()` serializes
`request.user`, which is `AnonymousUser`, and `AnonymousUser` has no `email`
attribute. Either way the assertion fails, and either way the fix is the same.

Copy the observed anonymous list response body into
`docs/decisions/0002-permission-baseline.md` as the evidence for the decision.
That body is the defect, reproduced.

- [ ] **Step 4: Apply the fix**

In `back/api/views.py`, replace the `permission_classes = []` line in
`UserViewSet` and add `get_permissions`:

```python
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to retrieve user data.

    Provides a read-only view of all users and includes custom actions to return
    the currently authenticated user's info and check username/email availability.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # The registration form has to ask whether a username or email is free
        # before the visitor has any credentials, so that one action - and only
        # that one - is public. An empty permission_classes list would have made
        # the whole user table public, which is what this replaces.
        if self.action == 'check_availability':
            return [permissions.AllowAny()]
        return super().get_permissions()
```

Change nothing else in the class. `me` and `check_availability` keep their
existing bodies.

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_users_api.py
```

Expected: 10 passed.

- [ ] **Step 6: Run the whole backend suite**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS. Nothing in the existing suite touched `/api/users/`, which is
precisely why the hole survived this long — say so in the ADR.

- [ ] **Step 7: Confirm the frontend still works against the change**

```bash
cd front && grep -rn "users/" src --include=*.js --include=*.jsx | grep -v __tests__
```

Expected three hits, and all three are safe:

- `src/contexts/AuthContext.jsx` calls `/users/me/` only after a token exists.
- `src/stores/useUserStore.js` calls `/users/` only from `UserFetcher`, which `App.jsx:54` renders only when `authenticatedUser` is set.
- `src/components/authentication/Register.jsx` calls `/users/check_availability/`, which stays public.

If a fourth hit appears that runs before login, stop and report it — the fix
would break the login screen.

- [ ] **Step 8: Commit**

```bash
git add back/api/views.py back/api/tests/test_users_api.py docs/decisions/0002-permission-baseline.md
git commit -m "security: require credentials to read the user endpoints"
```

### Task 8: Security — stop trusting the client-supplied report owner

Also a security fix, so it asserts the corrected behaviour (Spec D8).

**Files:**
- Create: `back/api/tests/test_report_ownership.py`
- Modify: `back/api/serializers.py`
- Modify: `back/api/views.py`
- Modify: `docs/decisions/0005-deferred-findings.md`

**Interfaces:**
- Consumes: `make_user`, `authenticate` from `api.tests.helpers` (Task 2).
- Produces: `ReportViewSet.perform_create(self, serializer)` — saves with `user=self.request.user`. `ReportSerializer.user` becomes read-only, so no later task may write it from request data.

- [ ] **Step 1: Read the defect**

```bash
cd back && grep -n "fields = '__all__'" api/serializers.py
cd ../front && grep -n "user:" src/components/reports/ReportModal.jsx
```

`ReportSerializer.Meta.fields = '__all__'` makes `Report.user` a writable
`PrimaryKeyRelatedField`, and `ReportModal.jsx:44` supplies it from
`authenticatedUser.id`. The server never checks it, so any authenticated caller
can file a report under any other employee's name. In a workshop application the
report author is the accountability record for the work done, so this is not
cosmetic.

- [ ] **Step 2: Write the failing test**

Create `back/api/tests/test_report_ownership.py`:

```python
"""
Security tests for report attribution.

Per spec decision D8 these assert the CORRECTED behaviour. Today `user` is a
writable field on ReportSerializer and the client supplies it, so a report can
be filed under anyone's name. These tests fail first and Task 8 makes them pass.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Owner, Report, Vehicle
from api.tests.helpers import authenticate, make_user


class ReportAttributionTests(APITestCase):
    def setUp(self):
        self.author = make_user(email="author@example.com", username="author")
        self.colleague = make_user(email="colleague@example.com", username="colleague")
        authenticate(self.client, self.author)

        owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        self.vehicle = Vehicle.objects.create(
            owner=owner, brand="Audi", model="A3", year=2015, license_plate="OWN-1"
        )

    def test_a_new_report_is_attributed_to_the_caller(self):
        response = self.client.post(
            reverse("report-list"),
            {"vehicle": self.vehicle.id, "status": "pending"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(pk=response.data["id"])
        self.assertEqual(report.user_id, self.author.id)

    def test_a_supplied_user_id_is_ignored(self):
        response = self.client.post(
            reverse("report-list"),
            {
                "vehicle": self.vehicle.id,
                "status": "pending",
                "user": self.colleague.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(pk=response.data["id"])
        self.assertEqual(report.user_id, self.author.id)

    def test_an_update_cannot_reattribute_an_existing_report(self):
        report = Report.objects.create(
            vehicle=self.vehicle, user=self.author, status="pending"
        )
        response = self.client.patch(
            reverse("report-detail", kwargs={"pk": report.pk}),
            {
                "status": "in_progress",
                "user": self.colleague.id,
                "updated_at": report.updated_at,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.user_id, self.author.id)
        self.assertEqual(report.status, "in_progress")

    def test_the_response_still_reports_who_owns_it(self):
        response = self.client.post(
            reverse("report-list"),
            {"vehicle": self.vehicle.id, "status": "pending"},
            format="json",
        )
        self.assertEqual(response.data["user"], self.author.id)
```

The last test matters as much as the first three: the frontend reads
`report.user` to label rows, so the field must keep appearing in responses. A
fix that removed it from the payload entirely would pass a write-only test and
break the UI.

- [ ] **Step 3: Run it and watch it fail**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_report_ownership.py
```

Expected: **FAIL**. `test_a_supplied_user_id_is_ignored` finds the report owned
by `colleague`, and `test_an_update_cannot_reattribute_an_existing_report`
likewise. `test_a_new_report_is_attributed_to_the_caller` fails differently —
without a `user` in the payload the report is created with `user = NULL`
(`Report.user` is `null=True`), so `report.user_id` is `None`.

- [ ] **Step 4: Make `user` read-only on the serializer**

In `back/api/serializers.py`, inside `ReportSerializer`, add the field
declaration next to the existing `tasks`/`parts` declarations:

```python
    # The author is taken from the authenticated request in
    # ReportViewSet.perform_create, never from the request body. It stays in the
    # output because the UI labels rows with it.
    user = serializers.PrimaryKeyRelatedField(read_only=True)
```

- [ ] **Step 5: Set the author from the request in the viewset**

In `back/api/views.py`, add to `ReportViewSet`, immediately after the
`ordering_fields` assignment and before `list`:

```python
    def perform_create(self, serializer):
        """Attribute a new report to whoever is making the request."""
        serializer.save(user=self.request.user)
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_report_ownership.py
```

Expected: 4 passed.

- [ ] **Step 7: Run the whole backend suite**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS. `test_reportviewset.py` creates its reports through the ORM, not
the API, so it is unaffected.

- [ ] **Step 8: Leave the frontend payload alone, and record why**

`ReportModal.jsx:44` keeps sending `user: authenticatedUser.id`. The server now
ignores it, and `useReportForm.js:59` lists `user` among its required fields, so
removing it from the payload would also mean editing that validation list and
the form state that feeds it. That is a larger change than this security fix
needs, and the field is inert.

Add to `docs/decisions/0005-deferred-findings.md`:

> The report modal still puts `user` in the create payload. The API ignores it
> as of the ownership fix, but the field and the client-side required check that
> depends on it were left in place; removing them touches the form hook, the
> modal state and the validation list for no behavioural gain.

- [ ] **Step 9: Commit**

```bash
git add back/api/serializers.py back/api/views.py \
        back/api/tests/test_report_ownership.py docs/decisions/0005-deferred-findings.md
git commit -m "security: attribute a report to its author, not to whoever the client names"
```

### Task 9: Security — apply Django's password validators at registration

Also a security fix, so it asserts the corrected behaviour (Spec D8).

**Files:**
- Create: `back/api/tests/test_registration_password.py`
- Modify: `back/api/serializers.py`

**Interfaces:**
- Consumes: `DEFAULT_PASSWORD` from `api.tests.helpers` (Task 2) — it is chosen to satisfy the validators this task starts enforcing.
- Produces: `UserSerializer.validate(self, attrs)` — raises `serializers.ValidationError({'password': [...]})` when Django's validators reject the password.

- [ ] **Step 1: Read the defect**

```bash
cd back && sed -n '150,167p' backend/settings.py && sed -n '55,71p' api/serializers.py
```

`AUTH_PASSWORD_VALIDATORS` lists four validators, but Django applies them only
through `UserCreationForm`, `SetPasswordForm` and `createsuperuser`.
`UserSerializer.create` calls `User.objects.create_user` directly, so none of
them run. The frontend's own checks are commented out at
`front/src/utils/validation.js:52-60`, leaving `isValidPassword` requiring one
lowercase letter and nothing more. A one-character password registers today.

- [ ] **Step 2: Write the failing test**

Create `back/api/tests/test_registration_password.py`:

```python
"""
Security tests for the registration password policy.

Per spec decision D8 these assert the CORRECTED behaviour. Registration accepts
any password today because DRF never runs AUTH_PASSWORD_VALIDATORS. These tests
fail first and Task 9 makes them pass.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import User
from api.tests.helpers import DEFAULT_PASSWORD


class RegistrationPasswordPolicyTests(APITestCase):
    def register(self, password, username="newbie", email="newbie@example.com"):
        return self.client.post(
            reverse("register"),
            {"username": username, "email": email, "password": password},
            format="json",
        )

    def test_a_one_character_password_is_rejected(self):
        response = self.register("a")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(email="newbie@example.com").exists())

    def test_a_short_password_is_rejected(self):
        response = self.register("abc123")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_an_entirely_numeric_password_is_rejected(self):
        response = self.register("9182736450")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_common_password_is_rejected(self):
        response = self.register("password123")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_password_that_is_the_username_is_rejected(self):
        response = self.register("verysimilaruser", username="verysimilaruser")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_a_strong_password_is_accepted(self):
        response = self.register(DEFAULT_PASSWORD)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newbie@example.com").exists())

    def test_the_error_body_explains_what_is_wrong(self):
        response = self.register("a")
        messages = " ".join(str(m) for m in response.data["password"])
        self.assertIn("8 characters", messages)
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_registration_password.py
```

Expected: **FAIL** — six of the seven fail with 201 where 400 was expected.
`test_a_strong_password_is_accepted` passes, because it always would have.

- [ ] **Step 4: Apply the fix**

In `back/api/serializers.py`, add these imports next to the existing Django
imports at the top of the file:

```python
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
```

Then add a `validate` method to `UserSerializer`, above the existing `create`:

```python
    def validate(self, attrs):
        """Run AUTH_PASSWORD_VALIDATORS, which create_user does not.

        Django applies these validators from its auth forms, not from the model
        manager, so a serializer that calls create_user directly bypasses every
        one of them. The throwaway User instance gives
        UserAttributeSimilarityValidator something to compare against; it is
        never saved.
        """
        password = attrs.get('password')
        if password:
            candidate = User(
                username=attrs.get('username', ''),
                email=attrs.get('email', ''),
            )
            try:
                validate_password(password, candidate)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_registration_password.py
```

Expected: 7 passed.

- [ ] **Step 6: Run the whole backend suite and check the existing fixtures**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS.

Three existing modules register through the API with the password
`strongpassword123`: `test_auth_api.py:23`, `test_vehicles_edgecases.py:37` and
`test_vehicles_withJWT_api.py:29`. Seventeen characters, mixed case is not
required, not numeric, not similar to `john_doe` or `john@example.com`, and not
in Django's common-password list — so it should pass unchanged.

If one of them now fails with a `password` error, read the message. If it names
the common-password list, change that fixture's password to
`Str0ng-Test-Passphrase!` (the same value `helpers.DEFAULT_PASSWORD` uses) and
change it in **both** the register payload and the login payload of that module.
That is not weakening the characterization: those tests are about vehicles and
tokens, not about password strength.

Modules that call `User.objects.create_user` directly — `test_models.py`,
`test_owners_api.py`, `test_reportviewset.py`, `test_vehicles_permissions.py` —
never touch the serializer and cannot be affected.

- [ ] **Step 7: Commit**

```bash
git add back/api/serializers.py back/api/tests/test_registration_password.py
git commit -m "security: enforce the configured password validators at registration"
```

### Task 10: Split settings by environment

**Files:**
- Delete: `back/backend/settings.py`
- Create: `back/backend/settings/__init__.py`, `back/backend/settings/base.py`, `back/backend/settings/development.py`, `back/backend/settings/production.py`
- Modify: `docker-compose.yml`
- Modify: `docs/decisions/0001-settings-split-by-environment.md`, `docs/decisions/0005-deferred-findings.md`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: the importable name `backend.settings` is unchanged, so `manage.py`, `wsgi.py`, `asgi.py`, `pytest.ini` and `.github/workflows/deploy.yml` need no edit. Selection is by the `DJANGO_ENV` environment variable: `production` loads `production.py`, anything else (including unset) loads `development.py`.

- [ ] **Step 1: Record the exact current file before splitting it**

```bash
cd back && cp backend/settings.py /tmp/settings-before.py && wc -l /tmp/settings-before.py
```

Expected: 262 (the file ends without a trailing newline). Every setting in it must appear in exactly one of
the four new modules. Step 8 diffs the resolved settings to prove it.

- [ ] **Step 2: Create the package selector**

```bash
cd back && mkdir -p backend/settings
```

Create `back/backend/settings/__init__.py`:

```python
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
```

- [ ] **Step 3: Create `base.py`**

Create `back/backend/settings/base.py` with the entire contents of the old
`back/backend/settings.py`, with these five changes and no others:

1. `BASE_DIR` gains one more `.parent`, because the file moved down a directory:

```python
# back/backend/settings/base.py -> back/backend/settings -> back/backend -> back
BASE_DIR = Path(__file__).resolve().parent.parent.parent
```

2. `load_dotenv` moves to the top, **before** the `read_secret` calls. Today it
runs at line 56, after the three secrets are resolved at lines 51-53, so
`back/.env` cannot supply `DJANGO_SECRET_KEY`, `MYSQL_USER` or `MYSQL_PASSWORD` —
which contradicts `back/.env.example` and the README. Place it immediately after
`BASE_DIR`:

```python
# Before any secret or setting is read, so back/.env can supply every one of
# them. It previously ran after read_secret(), which silently made three of the
# documented variables unusable from that file.
load_dotenv(os.path.join(BASE_DIR, '.env'))
```

3. `MYSQL_HOST = os.getenv('MYSQL_HOST')` moves below `load_dotenv` for the same
reason.

4. `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CORS_ORIGIN_WHITELIST`
are **removed** from `base.py` entirely. They move to the per-environment
modules in Steps 4 and 5.

5. A shared parser is added just below `read_secret`, so both environment
modules read comma-separated lists the same way:

```python
def csv_env(name, default=''):
    """Parse a comma-separated environment variable into a list of strings.

    CORS_ALLOWED_ORIGINS was previously read as
    `os.getenv('CORS_ALLOWED_ORIGINS').split(',')`, which raises AttributeError
    on an unset variable - before Django starts, with no useful message.
    """
    raw = os.getenv(name, default) or ''
    return [item.strip() for item in raw.split(',') if item.strip()]
```

Everything else — `read_secret`, the three secrets, `SECRET_KEY`,
`INSTALLED_APPS`, `MIDDLEWARE`, `REST_FRAMEWORK`, `ROOT_URLCONF`, `TEMPLATES`,
`WSGI_APPLICATION`, `DATABASES`, `AUTH_PASSWORD_VALIDATORS`, `AUTH_USER_MODEL`,
the i18n block, the static and media block, `DEFAULT_AUTO_FIELD`, `SIMPLE_JWT`
and `LOGGING` — is copied verbatim.

- [ ] **Step 4: Create `development.py`**

Create `back/backend/settings/development.py`:

```python
"""Development and CI settings.

This is what `DJANGO_ENV` unset resolves to. It reproduces exactly what the
single settings.py did before the split: DEBUG comes from the environment and
defaults to off, and both host lists come from comma-separated variables.
"""

from .base import *  # noqa: F401,F403
from .base import csv_env, os

# Any of 1/true/yes enables it. Default off, so a forgotten variable is safe.
DEBUG = os.getenv('DEBUG', 'False').lower() in {'1', 'true', 'yes'}

ALLOWED_HOSTS = csv_env('ALLOWED_HOSTS')

# Defaulted rather than mandatory. Reading it with a bare .split(',') used to
# raise AttributeError at import when the variable was missing.
CORS_ALLOWED_ORIGINS = csv_env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')
```

`CORS_ORIGIN_WHITELIST` is not carried over. It is the pre-3.0 name of this
setting and django-cors-headers 4.6.0 ignores it entirely — see Step 9.

- [ ] **Step 5: Create `production.py`**

Create `back/backend/settings/production.py`:

```python
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

ALLOWED_HOSTS = csv_env('ALLOWED_HOSTS')
CORS_ALLOWED_ORIGINS = csv_env('CORS_ALLOWED_ORIGINS')

# traefik terminates TLS and forwards over plain HTTP on the internal network,
# so without this Django believes every request is insecure and would refuse to
# set secure cookies.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'

# The Django admin posts forms; those origins must be trusted by name under
# Django 4+. Derived from ALLOWED_HOSTS so there is one list to maintain.
CSRF_TRUSTED_ORIGINS = [f'https://{host}' for host in ALLOWED_HOSTS if '.' in host]

# Deliberately NOT set here:
#   SECURE_SSL_REDIRECT  - traefik already redirects the web entrypoint to
#                          websecure, and a second redirect inside Django would
#                          also catch the container healthcheck.
#   SECURE_HSTS_SECONDS  - traefik's security-headers@file middleware emits
#                          Strict-Transport-Security; setting it here too would
#                          send the header twice.
# `manage.py check --deploy` warns about both (W004, W008). Those two warnings
# are expected - see docs/decisions/0001-settings-split-by-environment.md.
```

- [ ] **Step 6: Delete the old file**

```bash
cd back && git rm backend/settings.py
```

`git status` must now show `backend/settings.py` deleted and four new files
under `backend/settings/`. If Python still finds the old module, a stale
`backend/__pycache__/settings.cpython-*.pyc` is shadowing it:

```bash
cd back && find . -name "settings.cpython-*.pyc" -delete
```

- [ ] **Step 7: Tell production which module to load**

In `docker-compose.yml`, in the `backend` service's `environment:` block, add
one line next to the existing `IS_DOCKER`:

```yaml
    environment:
      IS_DOCKER: "True"
      DJANGO_ENV: "production"
```

This is the only place production learns about the split. Without it the
deployed container would silently load `development.py`, where `DEBUG` follows
whatever `back.env` says — which is exactly the failure this split exists to
prevent. Do not put it in `/srv/secrets/workshop/back.env`: that file is not in
the repository and is out of scope (Spec §6).

- [ ] **Step 8: Prove the resolved settings did not change**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -c "
from django.conf import settings
import django; django.setup()
for name in ('DEBUG','ALLOWED_HOSTS','CORS_ALLOWED_ORIGINS','INSTALLED_APPS',
             'MIDDLEWARE','REST_FRAMEWORK','AUTH_USER_MODEL','STATIC_URL',
             'MEDIA_URL','DEFAULT_AUTO_FIELD','ROOT_URLCONF'):
    print(name, '=', getattr(settings, name))
print('DATABASES engine =', settings.DATABASES['default']['ENGINE'])
print('SIMPLE_JWT access lifetime =', settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'])
"
```

Expected output, exactly:

```
DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOWED_ORIGINS = ['http://localhost']
INSTALLED_APPS = ['django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles', 'rest_framework', 'rest_framework_simplejwt', 'corsheaders', 'django_filters', 'api']
```

...and the remaining lines matching `/tmp/settings-before.py`. Read them against
that file. Any difference is a copy error in Step 3, not an improvement.

- [ ] **Step 9: Prove the unset-CORS crash is gone**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -c "
from django.conf import settings
import django; django.setup()
print('CORS_ALLOWED_ORIGINS =', settings.CORS_ALLOWED_ORIGINS)
print('ALLOWED_HOSTS =', settings.ALLOWED_HOSTS)
"
```

Note that `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are absent from this
command. Expected:

```
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
ALLOWED_HOSTS = []
```

Before this task the same command raised
`AttributeError: 'NoneType' object has no attribute 'split'`.

- [ ] **Step 10: Run the deployment check against the production module**

```bash
cd back && env \
  DJANGO_ENV=production DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=workshop.santoriello.ch \
  CORS_ALLOWED_ORIGINS=https://workshop.santoriello.ch \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python manage.py check --deploy --fail-level ERROR
```

Expected: exit 0, with exactly two warnings — `security.W004` (no
`SECURE_HSTS_SECONDS`) and `security.W008` (no `SECURE_SSL_REDIRECT`). Both are
deliberate and both are explained in the comment block in `production.py`.

If a **third** warning appears, do not silence it. Read it, decide whether the
setting belongs in `production.py`, and record the decision in
`docs/decisions/0001-settings-split-by-environment.md`. If `security.W009`
(insecure `SECRET_KEY`) appears, that is only because this command passes a
throwaway key — production reads the real one from a Docker secret.

- [ ] **Step 11: Run both suites**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS, same count as after Task 9. `pytest.ini` still says
`DJANGO_SETTINGS_MODULE = backend.settings` and does not change; that is the
whole point of the package selector.

- [ ] **Step 12: Record the removed setting**

Add to `docs/decisions/0005-deferred-findings.md`:

> `CORS_ORIGIN_WHITELIST = ['http://localhost']` was removed rather than
> migrated. It is the pre-3.0 name of `CORS_ALLOWED_ORIGINS`; django-cors-headers
> 4.6.0 ignores it, so it had no effect and reading it as live configuration was
> misleading. `localhost` is not added to `CORS_ALLOWED_ORIGINS` in its place,
> because production serves the frontend from the same origin as the API and
> does not need it; `back/.env.example` already sets `http://localhost:3000` for
> the Vite dev server.

- [ ] **Step 13: Commit**

```bash
git add back/backend/settings docker-compose.yml \
        docs/decisions/0001-settings-split-by-environment.md \
        docs/decisions/0005-deferred-findings.md
git rm --cached back/backend/settings.py 2>/dev/null || true
git commit -m "refactor: split settings by environment and stop crashing on unset CORS origins"
```

### Task 11: Remove the N+1 query patterns

**Files:**
- Create: `back/api/tests/test_query_counts.py`
- Modify: `back/api/views.py`

**Interfaces:**
- Consumes: `make_user`, `authenticate` from `api.tests.helpers` (Task 2); the `total_cost` value pinned by Task 5.
- Produces: `ReportViewSet.queryset` and `InvoiceViewSet.queryset` with eager loading. Task 12 must not narrow them when it edits `list()`.

- [ ] **Step 1: Read the two traversals**

```bash
cd back && sed -n '234,246p' api/models.py && sed -n '353,387p' api/serializers.py
```

`Invoice.total_cost` walks `self.report.task_set` and then
`task.task_template.price` for every task, plus `self.report.part_set` and then
`part.part.unit_price` for every part. `InvoiceSerializer` additionally reads
`obj.report.vehicle.owner.full_name` and `obj.report.vehicle.license_plate`.
`InvoiceViewSet.queryset` is a bare `Invoice.objects.all()`, so listing invoices
costs roughly `5 + tasks + parts` queries **per invoice**.

`ReportSerializer` serializes `task_set` and `part_set` for every row, and
`ReportViewSet.queryset` prefetches neither.

- [ ] **Step 2: Write the failing test**

This test does not assert an absolute query count. It asserts that the count
does not grow with the number of rows, which is the property that actually
matters and which does not have to be re-tuned every time a field is added.

Create `back/api/tests/test_query_counts.py`:

```python
"""
Query-count tests for the two list endpoints that serialize related objects.

These assert a property rather than a number: listing N rows must cost the same
number of queries as listing one. An absolute count would have to be retuned
whenever a field is added; this formulation only fails when eager loading is
actually lost.
"""

from decimal import Decimal

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.test import APITestCase

from api.models import (
    Inventory,
    Invoice,
    Owner,
    Part,
    Report,
    Task,
    TaskTemplate,
    Vehicle,
)
from api.tests.helpers import authenticate, make_user


class ListQueryCountTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="e@example.com", username="e")
        authenticate(self.client, self.user)

        self.owner = Owner.objects.create(
            first_name="Ada", last_name="Lovelace", email="ada@example.com"
        )
        self.template = TaskTemplate.objects.create(
            name="Oil change", price=Decimal("50.00")
        )
        self.item = Inventory.objects.create(
            name="Oil filter",
            reference_code="OF-1",
            quantity_in_stock=Decimal("1000.00"),
            unit_price=Decimal("15.00"),
        )
        self.serial = 0

    def build_report(self):
        """Create one report with one task and one part, and return it."""
        self.serial += 1
        vehicle = Vehicle.objects.create(
            owner=self.owner,
            brand="Audi",
            model="A3",
            year=2015,
            license_plate=f"QC-{self.serial}",
        )
        report = Report.objects.create(
            vehicle=vehicle, user=self.user, status="completed"
        )
        Task.objects.create(report=report, task_template=self.template)
        Part.objects.create(report=report, part=self.item, quantity_used=Decimal("2.00"))
        return report

    def count_queries(self, url):
        with CaptureQueriesContext(connection) as captured:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
        return len(captured)

    def test_listing_reports_costs_the_same_for_one_row_and_for_five(self):
        self.build_report()
        one = self.count_queries(reverse("report-list"))

        for _ in range(4):
            self.build_report()
        five = self.count_queries(reverse("report-list"))

        self.assertEqual(
            five,
            one,
            f"listing 5 reports cost {five} queries and listing 1 cost {one}; "
            "the report queryset is missing prefetch_related",
        )

    def test_listing_invoices_costs_the_same_for_one_row_and_for_five(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        one = self.count_queries(reverse("invoice-list"))

        for index in range(2, 6):
            Invoice.objects.create(
                invoice_number=f"INV-{index}", report=self.build_report()
            )
        five = self.count_queries(reverse("invoice-list"))

        self.assertEqual(
            five,
            one,
            f"listing 5 invoices cost {five} queries and listing 1 cost {one}; "
            "the invoice queryset is missing select_related/prefetch_related",
        )

    def test_the_invoice_total_is_unchanged_by_eager_loading(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        row = self.client.get(reverse("invoice-list")).data[0]
        # one task at 50.00 plus two parts at 15.00 each
        self.assertEqual(Decimal(str(row["total_cost"])), Decimal("80.00"))

    def test_the_invoice_customer_fields_are_unchanged_by_eager_loading(self):
        Invoice.objects.create(invoice_number="INV-1", report=self.build_report())
        row = self.client.get(reverse("invoice-list")).data[0]
        self.assertEqual(row["owner_full_name"], "Ada Lovelace")
        self.assertEqual(row["vehicle_plate"], "QC-1")
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_query_counts.py
```

Expected: **FAIL** on both count tests. The failure messages print the two
numbers; write them down, they go in the handover and in
`docs/decisions/0005-deferred-findings.md` as the before figures.

The two `unchanged_by_eager_loading` tests pass now and must still pass after
the fix — they are what proves the queryset change altered performance and not
output.

- [ ] **Step 4: Fix the report queryset**

In `back/api/views.py`, replace the `queryset` line in `ReportViewSet`:

```python
    # tasks_data and parts_data serialize task_set and part_set for every row,
    # and TaskSerializer/PartSerializer render their foreign keys as ids, so the
    # two prefetches are enough - no deeper join is needed.
    queryset = (
        Report.objects
        .select_related('vehicle')
        .prefetch_related('task_set', 'part_set')
        .all()
    )
```

- [ ] **Step 5: Fix the invoice queryset**

In `back/api/views.py`, replace the `queryset` line in `InvoiceViewSet`:

```python
    # The serializer reads report.vehicle.owner for owner_full_name and
    # vehicle_plate, and Invoice.total_cost walks report.task_set.task_template
    # and report.part_set.part. All four paths are loaded up front.
    queryset = (
        Invoice.objects
        .select_related('report__vehicle__owner')
        .prefetch_related('report__task_set__task_template', 'report__part_set__part')
        .all()
    )
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q api/tests/test_query_counts.py
```

Expected: 4 passed. Record the new constant query counts from a re-run with
`-s` if you want the numbers; the assertion only needs them to be equal.

If the invoice test still fails, the remaining growth is in
`InvoiceSerializer.get_pdf_exists`, which calls `os.path.exists` — that is
filesystem I/O, not a query, so it cannot be the cause. Re-read the two
`prefetch_related` paths against the field names in `api/models.py`; a
misspelled path raises rather than silently degrading, so a green-but-growing
result means one of the traversals in the serializer is not covered.

- [ ] **Step 7: Run the whole backend suite**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS. Task 5's `test_total_cost_is_computed_from_tasks_and_parts` and
`test_a_row_carries_the_derived_customer_fields` must pass **unchanged** — they
are the proof the eager loading changed no output.

- [ ] **Step 8: Commit**

```bash
git add back/api/views.py back/api/tests/test_query_counts.py
git commit -m "perf: load report and invoice relations eagerly"
```

### Task 12: Collapse the copy-pasted viewset and serializer code

**Files:**
- Create: `back/api/pagination.py`, `back/api/mixins.py`
- Modify: `back/api/views.py`, `back/api/serializers.py`
- Modify: `docs/decisions/0005-deferred-findings.md`

**Interfaces:**
- Consumes: the 400/409/200 contract pinned by Task 4, the response shapes pinned by Task 5, and the eager-loaded querysets produced by Task 11.
- Produces:
  - `api.pagination.CustomPagination` — moved unchanged from `views.py`, `default_limit = 5`.
  - `api.mixins.OptionalPaginationMixin` with class attribute `default_ordering: str`; supplies `list()`.
  - `api.serializers.ConcurrencyCheckMixin` with class attribute `conflict_noun: str`; supplies `validate()`.

- [ ] **Step 1: Count what is being removed**

```bash
cd back && grep -c "Allow partial updates while keeping existing values" api/views.py
grep -c "If no pagination params are set, return all results" api/views.py
grep -c "Check concurrency using updated_at timestamp from client" api/serializers.py
```

Expected: `6`, `3`, `5`. Six identical `update()` overrides, three identical
`list()` overrides, five identical concurrency checks.

- [ ] **Step 2: Move the paginator into its own module**

Create `back/api/pagination.py`:

```python
from rest_framework.pagination import LimitOffsetPagination


class CustomPagination(LimitOffsetPagination):
    """The page size used when a caller asks for pagination without a limit."""

    default_limit = 5
```

Delete the `CustomPagination` class and the now-unused
`from rest_framework.pagination import LimitOffsetPagination` import from
`back/api/views.py`.

- [ ] **Step 3: Create the list mixin**

Create `back/api/mixins.py`:

```python
from rest_framework.response import Response

from .pagination import CustomPagination


class OptionalPaginationMixin:
    """List endpoints that return a bare array unless the caller asks for a page.

    ReportViewSet, InventoryViewSet and InvoiceViewSet each carried a private
    copy of this, identical apart from the default ordering. Set
    `default_ordering` to the ordering applied when the caller supplies none.

    The originals assigned `self.pagination_class` before paginating. That was a
    per-request side effect on the view instance and is not reproduced; the
    paginator is constructed directly instead.
    """

    default_ordering = 'id'

    def list(self, request, *args, **kwargs):
        ordering = request.query_params.get('ordering', self.default_ordering)
        queryset = self.filter_queryset(self.get_queryset()).order_by(*ordering.split(','))

        if request.query_params.get('limit') or request.query_params.get('offset'):
            paginator = CustomPagination()
            page = paginator.paginate_queryset(queryset, request)
            return paginator.get_paginated_response(
                self.get_serializer(page, many=True).data
            )

        return Response(self.get_serializer(queryset, many=True).data)
```

- [ ] **Step 4: Apply the mixin to the three viewsets**

In `back/api/views.py`, add `from .mixins import OptionalPaginationMixin` to the
local imports, then:

- `class ReportViewSet(OptionalPaginationMixin, viewsets.ModelViewSet):` and add `default_ordering = 'vehicle__brand,vehicle__model'` next to `pagination_class = None`. Delete its `list()` method.
- `class InventoryViewSet(OptionalPaginationMixin, viewsets.ModelViewSet):` and add `default_ordering = 'name'`. Delete its `list()` method.
- `class InvoiceViewSet(OptionalPaginationMixin, viewsets.ModelViewSet):` and add `default_ordering = 'issued_date'`. Delete its `list()` method.

The mixin comes first in the bases so its `list` wins over
`ListModelMixin.list`. `pagination_class = None` stays on all three: it is what
stops DRF's own pagination from also running.

- [ ] **Step 5: Delete five `update()` overrides and rewrite the sixth**

Delete `update()` from `OwnerViewSet`, `VehicleViewSet`, `TaskTemplateViewSet`,
`InventoryViewSet` and `InvoiceViewSet` outright. DRF's
`UpdateModelMixin.update` does the same thing: it pops `partial`, fetches the
object, validates, saves and returns the serialized data — and on a validation
failure it raises `ValidationError(serializer.errors)`, which DRF's exception
handler renders as the same 400 body the hand-written version returned. A
`ConflictException` raised inside `validate()` is an `APIException`, not a
`ValidationError`, so it is unaffected either way and still surfaces as 409.

`ReportViewSet.update` cannot simply be deleted — it also generates the invoice.
Replace its body with a wrapper:

```python
    def update(self, request, *args, **kwargs):
        """Update the report, and generate an invoice the first time it is exported."""
        instance = self.get_object()
        previous_status = instance.status

        response = super().update(request, *args, **kwargs)

        instance.refresh_from_db()
        if previous_status != 'exported' and instance.status == 'exported':
            generate_invoice(instance, request)

        return response
```

- [ ] **Step 6: Run the suite before touching the serializers**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS, same count. Running here rather than at the end of the task
isolates a viewset regression from a serializer regression.

Task 4's eleven concurrency tests and Task 5's seventeen shape tests are what
this run is really checking. If `test_update_triggers_invoice` in
`test_reportviewset.py` fails, the wrapper's `refresh_from_db` is reading a
stale row — check that `super().update()` really committed before the check.

- [ ] **Step 7: Create the serializer concurrency mixin**

In `back/api/serializers.py`, add this class immediately below the imports and
above `LoginSerializer`:

```python
class ConcurrencyCheckMixin:
    """Rejects an update whose `updated_at` does not match the stored row.

    Five serializers carried an identical copy of this, differing only in the
    noun in the conflict message. `conflict_noun` supplies that noun. Creation
    is exempt: there is no stored row to compare against.
    """

    conflict_noun = 'record'

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if self.instance is None:
            return attrs

        client_updated_at = self.initial_data.get('updated_at')
        if not client_updated_at:
            raise serializers.ValidationError(
                "Missing 'updated_at' field for concurrency check."
            )

        try:
            client_parsed_updated_at = isoparse(client_updated_at)
        except Exception:
            raise ValidationError('Invalid timestamp format.')

        if abs(
            (client_parsed_updated_at - self.instance.updated_at).total_seconds()
        ) > 0.000001:
            raise ConflictException(
                f'This {self.conflict_noun} has been modified by someone else. '
                'Please refresh.'
            )

        return attrs
```

- [ ] **Step 8: Apply the mixin to the five serializers**

Change each class declaration and delete its `validate` method, keeping every
other method exactly as it is:

| Serializer | New declaration | `conflict_noun` |
|---|---|---|
| `OwnerSerializer` | `class OwnerSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):` | `'owner'` |
| `VehicleSerializer` | `class VehicleSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):` | `'vehicle'` |
| `TaskTemplateSerializer` | `class TaskTemplateSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):` | `'task template'` |
| `InventorySerializer` | `class InventorySerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):` | `'inventory part'` |
| `ReportSerializer` | `class ReportSerializer(ConcurrencyCheckMixin, serializers.ModelSerializer):` | `'report'` |

Add `conflict_noun = '<value>'` as the first line of each class body, above the
existing field declarations. The nouns above reproduce the messages the five
copies used verbatim, so no client-visible string changes.

`VehicleSerializer` keeps its `validate_year`; `UserSerializer` keeps the
`validate` added by Task 9 and does **not** get this mixin — it has no
`updated_at`.

- [ ] **Step 9: Confirm no copy survived**

```bash
cd back && grep -n "Check concurrency using updated_at timestamp from client" api/serializers.py
grep -n "Allow partial updates while keeping existing values" api/views.py
grep -n "If no pagination params are set, return all results" api/views.py
```

Expected: no output from any of the three.

- [ ] **Step 10: Run the whole backend suite**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

Expected: PASS, same count as Step 6.

- [ ] **Step 11: Record what was left inconsistent**

Add to `docs/decisions/0005-deferred-findings.md`:

> Pagination is still declared two different ways. `ReportViewSet`,
> `InventoryViewSet` and `InvoiceViewSet` opt out of DRF pagination and use
> `OptionalPaginationMixin`; `OwnerViewSet`, `VehicleViewSet`, `UserViewSet` and
> `UserProfileViewSet` inherit `LimitOffsetPagination` with no default page size,
> which happens to produce a bare array too — until a caller passes `limit`, at
> which point those four return the envelope and their zustand stores, which
> assign `response.data` straight into state, would store an object where an
> array is expected. Unifying this means changing the store contract as well as
> the API and is out of scope for this cycle.

- [ ] **Step 12: Commit**

```bash
git add back/api/pagination.py back/api/mixins.py back/api/views.py \
        back/api/serializers.py docs/decisions/0005-deferred-findings.md
git commit -m "refactor: one paginated list and one concurrency check instead of nine copies"
```

### Task 13: Consolidate the frontend onto one HTTP client

**Files:**
- Modify: `front/src/utils/axiosInstance.js`
- Modify: `front/src/utils/authUtils.js`
- Modify: `front/src/contexts/AuthContext.jsx`
- Modify: `front/src/components/authentication/Login.jsx`
- Modify: `front/src/components/authentication/Register.jsx`
- Modify: `front/src/stores/useUserStore.js`
- Modify: `front/src/components/fetchers/UserFetcher.js`
- Delete: `front/src/components/users/Profile.jsx`, `front/src/pages/Users.jsx`
- Create: `front/src/__tests__/components/Login.test.jsx`
- Modify: `front/src/__tests__/utils/axiosInstance.test.js`

**Interfaces:**
- Consumes: the four `axiosInstance` specs and the four `AuthContext` specs from Task 6; `authHeader(config)` from `axiosInstance.test.js`; the public `check_availability` action preserved by Task 7.
- Produces:
  - `API_BASE_URL: string` — new named export from `src/utils/axiosInstance.js`, equal to `import.meta.env.VITE_API_URL`.
  - `AuthContext.register(username, email, password) => Promise<boolean>` — now returns whether registration succeeded.
  - `useUserStore.updateUser(id, userData)` — renamed from `updateOwner`.

- [ ] **Step 1: Confirm the two dead files really are dead**

```bash
cd front && grep -rn "users/Profile\|pages/Users\|from './Users'\|useAxios" src --include=*.js --include=*.jsx
wc -c src/pages/Users.jsx
```

Expected: the only hits are inside `src/components/users/Profile.jsx` itself,
and `src/pages/Users.jsx` is 0 bytes. Nothing imports either file — which is why
`Profile.jsx`'s import of the non-existent `'../utils/useAxios'`, and its use of
`useState` and `useEffect` without importing them, have never broken a build.

If any other file appears in that grep, stop and do not delete.

- [ ] **Step 2: Delete them, then build and test**

```bash
cd front && git rm src/components/users/Profile.jsx src/pages/Users.jsx
npx vitest run && npx vite build
```

Expected: both PASS. A successful build is the proof the files were unreachable.

- [ ] **Step 3: Write the failing test for the interceptor loop**

Append to `front/src/__tests__/utils/axiosInstance.test.js`, inside the
`describe('axiosInstance', ...)` block:

```js
  it('does not loop when the replayed request is also rejected', async () => {
    refreshToken.mockResolvedValue('fresh-token')

    let calls = 0
    axiosInstance.defaults.adapter = async (config) => {
      calls += 1
      if (calls > 5) {
        throw new Error('the interceptor looped')
      }
      return Promise.reject({ response: { status: 401 }, config })
    }

    await expect(axiosInstance.get('/owners/')).rejects.toBeTruthy()

    expect(calls).toBe(2)
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(logout).toHaveBeenCalledTimes(0)
  })
```

- [ ] **Step 4: Run it to verify it fails**

```bash
cd front && npx vitest run src/__tests__/utils/axiosInstance.test.js
```

Expected: **FAIL** — `calls` is 6, not 2, and `refreshToken` was called five
times. The rejection handler replays through `axiosInstance(config)`, and that
replay re-enters the same handler with nothing to stop it.

- [ ] **Step 5: Rewrite the axios client**

Replace `front/src/utils/axiosInstance.js` entirely:

```js
import axios from 'axios'
import { refreshToken, logout } from './authUtils'

/**
 * The one base URL for every call to this API. Exported so nothing else has to
 * read import.meta.env directly - authUtils and the registration form used to.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Set the token dynamically (after login, or after a refresh).
export const setAxiosToken = (token) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    // `_retry` is what stops this from recursing. The replay below goes through
    // this same interceptor, so without the flag a request that keeps returning
    // 401 refreshes and replays forever.
    if (response && response.status === 401 && config && !config._retry) {
      config._retry = true

      const newToken = await refreshToken()
      if (newToken) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` }
        return axiosInstance(config)
      }

      logout()
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
```

The header is rebuilt by spreading rather than assigned by index. In axios 1.x
`config.headers` is an `AxiosHeaders` instance rather than a plain object;
spreading its own properties into a fresh object works under both versions and
lets axios re-normalize on the replay. Task 14 depends on this.

- [ ] **Step 6: Run the axios spec to verify it passes**

```bash
cd front && npx vitest run src/__tests__/utils/axiosInstance.test.js
```

Expected: 7 passed. The six from Task 6 must pass **unchanged** — in particular
`refreshes the token and replays the request after a 401`, which proves the
guard did not disable the retry it is protecting.

- [ ] **Step 7: Point `authUtils` at the shared base URL**

In `front/src/utils/authUtils.js`, replace the first four lines:

```js
import axios from 'axios'
import { API_BASE_URL, setAxiosToken } from './axiosInstance'
```

and delete the `const apiURL = import.meta.env.VITE_API_URL` line, replacing its
one use:

```js
    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    })
```

This call deliberately stays on the bare `axios` default instance rather than on
`axiosInstance`. Sending the refresh through the instrumented client would put
the refresh request itself inside the 401 handler that calls it.

- [ ] **Step 8: Fix the duplicated registration alert and the missing return**

In `front/src/contexts/AuthContext.jsx`, replace the whole `register` function:

```js
  const register = async (username, email, password) => {
    setLoadingAuth(true)
    try {
      await axiosInstance.post(`/register/`, { username, email, password })

      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'You have been registered successfully! Please log in.',
      })

      navigate('/login')
      return true
    } catch (error) {
      // One dialog, not two. The previous version fired inside the 400 branch
      // and then again unconditionally below it, so every failed registration
      // showed the message twice.
      const detail =
        error.response?.data?.detail ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0]

      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: detail || 'An error occurred during registration. Please try again.',
      })

      return false
    } finally {
      setLoadingAuth(false)
    }
  }
```

The `password`, `email` and `username` lookups are new and deliberate: after
Task 9 the API rejects a weak password with
`{"password": ["This password is too short..."]}`, and without reading that key
the user would be told only "An error occurred".

- [ ] **Step 9: Write the failing test for the disabled submit button**

Create `front/src/__tests__/components/Login.test.jsx`:

```jsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

import { useAuth } from '../../contexts/AuthContext'
import Login from '../../components/authentication/Login'

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables the submit button while authentication is in flight', () => {
    useAuth.mockReturnValue({ login: vi.fn(), loadingAuth: true })

    renderLogin()

    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
  })

  it('disables the submit button while the form is empty', () => {
    useAuth.mockReturnValue({ login: vi.fn(), loadingAuth: false })

    renderLogin()

    expect(screen.getByRole('button', { name: /^login$/i })).toBeDisabled()
  })
})
```

- [ ] **Step 10: Run it to verify the first test fails**

```bash
cd front && npx vitest run src/__tests__/components/Login.test.jsx
```

Expected: `disables the submit button while authentication is in flight` FAILS —
no button is labelled "Logging in", because `Login.jsx:14` destructures
`loading` from a context that only exposes `loadingAuth`, so `loading` is always
`undefined`. The second test passes.

- [ ] **Step 11: Fix the destructuring in both auth components**

In `front/src/components/authentication/Login.jsx`, line 14:

```js
  const { login, loadingAuth } = useAuth()
```

and in the two places the old name was used, lines 82-83:

```js
          <button type="submit" disabled={!isFormValid || loadingAuth}>
            {loadingAuth ? 'Logging in...' : 'Login'}
          </button>
```

In `front/src/components/authentication/Register.jsx`, line 16:

```js
  const { register, loadingAuth } = useAuth()
```

and lines 161-163:

```js
          <button type="submit" disabled={!isFormValid || loadingAuth}>
            {loadingAuth ? 'Registering...' : 'Register'}
          </button>
```

- [ ] **Step 12: Move the availability check onto the axios client**

In `front/src/components/authentication/Register.jsx`, delete the
`const apiURL = import.meta.env.VITE_API_URL` line at the top, add
`import axiosInstance from '../../utils/axiosInstance'` to the imports, and
replace `checkAvailability`:

```js
  // Deliberately builds the query string with URLSearchParams rather than
  // passing axios a `params` object: that keeps every call site in this
  // codebase free of axios parameter serialization, which is the part of the
  // 1.x upgrade in Task 14 that changes behaviour.
  const checkAvailability = async (field, value) => {
    try {
      const query = new URLSearchParams({ [field]: value })
      const { data } = await axiosInstance.get(`/users/check_availability/?${query}`)
      return data[`${field}_taken`] ? `${field} is already taken` : ''
    } catch (err) {
      return `Error checking ${field}`
    }
  }
```

`check_availability` is the one user action Task 7 left public, so this call
still works before login.

- [ ] **Step 13: Rename the mis-named user store method**

In `front/src/stores/useUserStore.js`, rename `updateOwner` to `updateUser`. It
updates a user, not an owner; `useOwnerStore` already has its own `updateOwner`
and the two are easy to confuse.

```bash
cd front && grep -rn "updateOwner" src --include=*.js --include=*.jsx
```

Expected after the rename: hits only in `src/stores/useOwnerStore.js`. If a
component calls `useUserStore(...).updateOwner`, update that call site too.

- [ ] **Step 14: Run the whole frontend suite and build**

```bash
cd front && npx vitest run && npx vite build
```

Expected: both PASS — the four pre-existing files, the three from Task 6, and
the one added here.

`AuthContext.test.jsx` from Task 6 must pass unchanged. Its mock of
`../../utils/axiosInstance` already declares `API_BASE_URL`, which is why
Step 5's new export does not break it.

- [ ] **Step 15: Confirm every HTTP call now goes through the client**

```bash
cd front && grep -rn "fetch(\|from 'axios'" src --include=*.js --include=*.jsx | grep -v __tests__
```

Expected exactly two lines: `src/utils/axiosInstance.js` (which creates the
instance) and `src/utils/authUtils.js` (the deliberate bare-axios refresh call).
No `fetch(` anywhere. If a third line appears, move it onto `axiosInstance`
before committing.

- [ ] **Step 16: Commit**

```bash
git add front/src
git commit -m "refactor: one HTTP client, a bounded retry, and a working loading state"
```

### Task 14: Move off `axios@0.27`

Spec D5. **Do not start this task until Task 6 and Task 13 are committed and
`npx vitest run` is green.** The whole reason the bump sits here and not in
Phase B is that the 1.x line changes error objects and parameter serialization,
and the only defence against that is a suite that already describes what the
client does.

**Files:**
- Modify: `front/package.json`, `front/package-lock.json`
- Modify: `docs/decisions/0005-deferred-findings.md`

**Interfaces:**
- Consumes: `axiosInstance`, `setAxiosToken`, `API_BASE_URL` from Task 13; the seven `axiosInstance` specs from Tasks 6 and 13; `authHeader(config)`, which already handles `AxiosHeaders`.
- Produces: nothing new. This task is a version change and a proof that nothing else moved.

- [ ] **Step 1: Record the version being replaced**

```bash
cd front && grep -n '"axios"' package.json && node -p "require('./node_modules/axios/package.json').version"
```

Expected: `"axios": "^0.27.2"` and a resolved `0.27.x`. That release is from
2022, the 0.x line receives no fixes, and it carries known advisories.

- [ ] **Step 2: Enumerate every call site, so the migration is bounded**

```bash
cd front && grep -rn "axiosInstance\.\(get\|post\|put\|patch\|delete\|request\)\|axiosInstance(\|axios\.\(get\|post\|put\|patch\|delete\|request\)" src --include=*.js --include=*.jsx | grep -v "__tests__"
```

Every line the command prints must appear in this table. The table is the
complete inventory as of the end of Task 13:

| File | Calls | Form |
|---|---|---|
| `src/utils/axiosInstance.js` | `axiosInstance(config)` — the replay inside the response interceptor | 1 |
| `src/utils/authUtils.js` | `axios.post(\`${API_BASE_URL}/token/refresh/\`, { refresh })` on the bare default instance | 1 |
| `src/contexts/AuthContext.jsx` | `get('/users/me/', { headers })`, `post('/login/', {...})`, `post('/register/', {...})` | 3 |
| `src/components/authentication/Register.jsx` | `get('/users/check_availability/?<query>')` | 1 |
| `src/stores/useOwnerStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useVehicleStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useReportStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useInventoryStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useInvoiceStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useTaskTemplateStore.js` | `get`, `post`, `patch`, `delete` | 4 |
| `src/stores/useUserStore.js` | `get`, `patch`, `delete` | 3 |
| | **total** | **33** |

If grep prints a line that is not in this table, stop and add it before
continuing. A call site nobody enumerated is exactly how a bump like this goes
wrong.

- [ ] **Step 3: Establish that the two behaviour changes do not apply here**

Confirm no call site passes a `params` object — that is the axios 1.x change
that alters query strings:

```bash
cd front && grep -rn "params:" src --include=*.js --include=*.jsx | grep -v "__tests__"
```

Expected: no output. Every call in the table builds its query string with
`URLSearchParams` and concatenates it onto the URL, including the one Task 13
moved off `fetch`. `paramsSerializer` therefore never runs, and the 1.x change
from a function to a `{ encode, serialize }` object cannot affect this codebase.

Now confirm what the code reads off an error:

```bash
cd front && grep -rn "error\.response\|error\.message\|err\.response" src --include=*.js --include=*.jsx | grep -v "__tests__"
```

Expected: hits in `src/utils/axiosInstance.js`, `src/contexts/AuthContext.jsx`,
`src/utils/authUtils.js` and the seven stores, all reading `error.response`,
`error.response.status`, `error.response.data` or `error.message`. All four
survive 1.x unchanged: `AxiosError` still carries `response`, `config` and
`message`. What 1.x adds is a `code` property, which nothing here reads.

Write both results into `docs/decisions/0005-deferred-findings.md` under a
heading naming this task. They are the argument for why the bump is small.

- [ ] **Step 4: Perform the bump**

```bash
cd front && npm install --legacy-peer-deps axios@^1.7.9
node -p "require('./node_modules/axios/package.json').version"
```

Expected: `1.7.9` or a later 1.x. `package.json` and `package-lock.json` are
both modified; commit both.

- [ ] **Step 5: Run the axios spec first, on its own**

```bash
cd front && npx vitest run src/__tests__/utils/axiosInstance.test.js
```

Expected: 7 passed, **unchanged**. This is the whole point of Task 6.

The one to read carefully is
`refreshes the token and replays the request after a 401`. It asserts
`authHeader(seen[1]) === 'Bearer fresh-token'`, and `authHeader` falls back to
`config.headers.get('Authorization')` when the headers object is an
`AxiosHeaders` — which is what 1.x hands the adapter. If that assertion fails,
the header rebuild in `axiosInstance.js` is not surviving normalization; fix
`axiosInstance.js`, not the test.

- [ ] **Step 6: Run the whole frontend suite**

```bash
cd front && npx vitest run
```

Expected: PASS, with the same test count as at the end of Task 13.

`src/App.test.jsx` mocks the whole `axios` module with a hand-built stub
(`create`, `get`, `post`, `request`, `interceptors`). That stub is version
agnostic, so it keeps working. If it does not, the failure will name a method
the real 1.x client calls that the stub lacks — add the method to the stub.

- [ ] **Step 7: Build**

```bash
cd front && npx vite build
```

Expected: PASS. axios 1.x ships proper ESM and CJS entry points; if Vite
complains about a missing export, it is naming the exact symbol, and the fix is
in the importing file rather than in a bundler configuration.

- [ ] **Step 8: Confirm no advisory remains for axios**

```bash
cd front && npm audit --omit=dev 2>&1 | grep -i -A3 axios || echo "NO AXIOS ADVISORY"
```

Expected: `NO AXIOS ADVISORY`. Other packages may still be reported; this task
is scoped to axios (Spec D5), so record anything else in
`docs/decisions/0005-deferred-findings.md` rather than fixing it here.

- [ ] **Step 9: Commit**

```bash
git add front/package.json front/package-lock.json docs/decisions/0005-deferred-findings.md
git commit -m "security: move off axios 0.27"
```

### Task 15: Formatter sweep

Deliberately last: running it earlier would mix reformatting into every review
diff above.

**Files:**
- Create: `ruff.toml`, `back/requirements-dev.txt`, `front/eslint.config.js`, `.git-blame-ignore-revs`
- Modify: `front/package.json`, `.github/workflows/deploy.yml`, `docs/technical.md`
- Delete: `front/.eslintrc.js`
- Modify: every Python and JavaScript source file (formatting only)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing that later code imports. Task 16 reads the sweep SHA from `.git-blame-ignore-revs`.

- [ ] **Step 1: Confirm both suites are green before reformatting anything**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

```bash
cd front && npx vitest run
```

Expected: both PASS. **Write down both test counts.** Step 8 compares against
them, and a sweep applied on top of a red suite makes it impossible to tell
formatting from breakage.

- [ ] **Step 2: Add the ruff configuration**

Create `ruff.toml` at the repository root:

```toml
# ruff covers back/ only; the frontend is handled by Prettier and ESLint.
line-length = 100
target-version = "py312"
extend-exclude = [
    "back/api/migrations",
    "back/staticfiles",
    "back/media",
]

[lint]
# E/W pycodestyle, F pyflakes, I import order, UP pyupgrade, B bugbear,
# C4 comprehensions. Deliberately not the full default-plus set: this is a
# formatting cycle, not a rewrite.
select = ["E", "W", "F", "I", "UP", "B", "C4"]
ignore = [
    # Django settings modules exist to be star-imported from base.
    "F403",
    "F405",
    # Line length is enforced by the formatter, not by the linter, so a long
    # URL in a comment is not an error.
    "E501",
]

[lint.per-file-ignores]
# Tests assert on names that ruff reads as unused when they only appear in a
# subTest label, and fixtures are deliberately verbose.
"back/api/tests/*" = ["B011"]

[format]
quote-style = "double"
indent-style = "space"
```

Create `back/requirements-dev.txt`:

```
# Development tooling. Deliberately NOT in requirements.txt: back/Dockerfile
# installs that file into the production image, and a linter has no business
# being there.
ruff==0.6.9
```

- [ ] **Step 3: Install ruff and see the scale of the change**

```bash
cd back && python -m pip install -r requirements-dev.txt
cd .. && python -m ruff check back --statistics
python -m ruff format --check back
```

Expected: both report findings. Read the statistics table. If ruff reports a
rule you did not select, your `ruff.toml` is not being found — run from the
repository root, not from `back/`.

- [ ] **Step 4: Port the ESLint configuration to the format ESLint 9 reads**

`front/package.json` pins `eslint: ^9.25.1`, but the configuration lives in
`front/.eslintrc.js`, which ESLint 9 does not load by default, and
`npm run lint` passes `--ext`, which ESLint 9 removed. Confirm:

```bash
cd front && npx eslint src --ext js,jsx ; echo "exit=$?"
```

Expected: a non-zero exit with a message about a missing `eslint.config.js`, or
about the unknown `--ext` option. Record which one you saw.

Create `front/eslint.config.js` carrying **the same rules** `.eslintrc.js`
already declares — this is a format port, not a policy change (Spec D4):

```js
const js = require('@eslint/js')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Was `env: { browser: true, es2021: true }` in .eslintrc.js.
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        btoa: 'readonly',
        // vitest globals, enabled by `test.globals: true` in vite.config.js.
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
      },
    },
    plugins: { react, 'react-hooks': reactHooks, prettier },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      // Copied verbatim from .eslintrc.js - same rules, same severities.
      'prettier/prettier': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
]
```

Add `@eslint/js` if it is not already resolvable:

```bash
cd front && npm install --legacy-peer-deps --save-dev @eslint/js
```

Then delete the old file and update the scripts:

```bash
cd front && git rm .eslintrc.js
```

In `front/package.json`, replace the two lint scripts — ESLint 9 infers the
extensions from the config, so `--ext` goes away:

```json
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
```

`front/.prettierrc` is **not** touched. Its four settings — `singleQuote: true`,
`trailingComma: "all"`, `semi: false`, `printWidth: 100` — are what the codebase
is already written in, and Spec D4 says to keep them.

- [ ] **Step 5: Confirm ESLint now runs**

```bash
cd front && npx eslint . ; echo "exit=$?"
```

Expected: it runs and reports warnings rather than failing to start. Warnings
are fine at this point; Step 6 fixes the formatting ones.

- [ ] **Step 6: Commit the configuration on its own, before any file is reformatted**

Spec D4 says the sweep commit contains formatting *only*. That is only true if
the tool configuration lands first, in its own commit.

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git add ruff.toml back/requirements-dev.txt \
        front/eslint.config.js front/package.json front/package-lock.json
git rm --cached front/.eslintrc.js 2>/dev/null || true
git commit -m "build: configure ruff, and move the ESLint config to the flat format"
```

```bash
git status --porcelain
```

Expected: clean, or only the deleted `front/.eslintrc.js` if `git rm` in Step 4
did not stage it. Stage and amend if so. No source file may appear yet.

- [ ] **Step 7: Run both formatters**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && python -m ruff check back --fix && python -m ruff format back
cd front && npx prettier --write "src/**/*.{js,jsx,css}" "*.js"
```

Read what `ruff check --fix` changed before moving on. It reorders imports and
removes unused ones, which is more than whitespace; `--fix` applies only rules
ruff marks as safe, but read the diff anyway.

- [ ] **Step 8: Read the diff before trusting it**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git diff --stat
```

Expected: many files, whitespace, quote style and import ordering only.

```bash
git diff -- back/api/models.py back/api/views.py | grep "^[-+]" | grep -v "^[-+][-+]" | grep -iE "if |return |raise |= " | head -40
```

Read every line this prints. Whitespace and quote changes are expected; a
changed condition, a moved `return`, or a reordered argument is not. If you find
one, revert and investigate before going further.

- [ ] **Step 9: Confirm nothing but formatting changed**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

```bash
cd front && npx vitest run && npx vite build
```

Expected: PASS, with **the same test counts as Step 1**. A changed count means
something other than formatting happened — most likely `ruff check --fix`
removed an import that a test relied on being present. Find it before
committing.

- [ ] **Step 10: Confirm both checkers are now clean**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && python -m ruff check back && python -m ruff format --check back
cd front && npx eslint . --max-warnings 0
```

Expected: all three exit 0.

If `ruff check` still reports findings, they are lint findings the formatter
cannot fix — an unused variable, a mutable default argument. Fix each one by
hand in this same commit if it is mechanical; if a fix would change behaviour,
add the rule to `ignore` in `ruff.toml` with a one-line comment saying why, and
record it in `docs/decisions/0005-deferred-findings.md`. Do not leave a red
checker and then wire it into CI in the next step.

- [ ] **Step 11: Commit formatting alone**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git add -A
git commit -m "style: apply ruff, Prettier and the ESLint 9 config across the codebase"
```

- [ ] **Step 12: Record the sweep so blame stays readable**

```bash
git rev-parse HEAD
```

Create `.git-blame-ignore-revs` at the repository root:

```
# Commits that only reformat. Enable with:
#   git config blame.ignoreRevsFile .git-blame-ignore-revs
# ruff, Prettier and ESLint 9 sweep, 2026-08-22
<paste the SHA printed above>
```

- [ ] **Step 13: Commit it and enable it locally**

```bash
git add .git-blame-ignore-revs
git commit -m "chore: ignore the formatting sweep in git blame"
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

- [ ] **Step 14: Wire both checkers into the existing test job**

In `.github/workflows/deploy.yml`, add a ruff step to the `test` job
immediately after `Install backend Python dependencies`:

```yaml
      - name: Lint and format-check the backend
        working-directory: .
        run: |
          pip install -r back/requirements-dev.txt
          ruff check back
          ruff format --check back
```

and an ESLint step immediately after `Install frontend dependencies`:

```yaml
      - name: Lint the frontend
        working-directory: front
        run: npx eslint . --max-warnings 0
```

Both run before their respective test steps, so a style failure is reported
without waiting for the suites. Both gate the deploy job, which is the point:
Spec D4 asks for formatting enforced by tooling rather than habit, and the only
tooling this repository has that runs on every push is this workflow.

Note the ruff step's `working-directory: .` — `ruff.toml` is at the repository
root and ruff discovers it by walking up from the target path, so running from
`back/` would also work, but being explicit makes the intent readable.

- [ ] **Step 15: Document the tooling**

Add a "Formatting" section to `docs/technical.md` stating:

- `pip install -r back/requirements-dev.txt`, then `ruff check back --fix` and `ruff format back` from the repository root.
- `npx prettier --write "src/**/*.{js,jsx,css}"` and `npx eslint . --fix` from `front/`.
- The configuration files: `ruff.toml` (root), `front/.prettierrc`, `front/eslint.config.js`.
- That each fresh clone needs the one-time `git config blame.ignoreRevsFile .git-blame-ignore-revs` for `git blame` to skip the sweep.
- That both checks run in `deploy.yml` and a style failure blocks the deploy.

```bash
git add docs/technical.md .github/workflows/deploy.yml
git commit -m "docs: record the formatting tooling and gate it in CI"
```

---

## Phase D — Verify

### Task 16: Full verification and handover

**Files:**
- Modify: `docs/decisions/0005-deferred-findings.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the verification record the reviewing session reads before merging.

- [ ] **Step 1: Run both suites from clean**

```bash
cd back && find . -name "__pycache__" -type d -prune -exec rm -rf {} + ; env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python -m pytest -q
```

```bash
cd front && npx vitest run
```

Expected: PASS. Record both test counts — they go in the handover, alongside the
baselines recorded in Task 2.

- [ ] **Step 2: Run both checkers exactly as CI will**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && python -m ruff check back && python -m ruff format --check back
cd front && npx eslint . --max-warnings 0
```

Expected: all three exit 0. If they do not, CI will block the deploy on the
first push after merge, which is worse than finding it here.

- [ ] **Step 3: Run the deployment check against the production settings**

```bash
cd back && env \
  DJANGO_ENV=production DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=workshop.santoriello.ch \
  CORS_ALLOWED_ORIGINS=https://workshop.santoriello.ch \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python manage.py check --deploy --fail-level ERROR
```

Expected: exit 0, with exactly the two warnings Task 10 Step 10 named
(`security.W004`, `security.W008`), plus `security.W009` for the throwaway key
used by this command.

- [ ] **Step 4: Confirm no migration was created**

```bash
cd back && env \
  DJANGO_SETTINGS_MODULE=backend.settings \
  DJANGO_SECRET_KEY=local-test-key-not-used-in-production \
  MYSQL_DATABASE=workshop_db MYSQL_USER=root MYSQL_PASSWORD=ci-root-password \
  MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  ALLOWED_HOSTS=localhost,127.0.0.1 CORS_ALLOWED_ORIGINS=http://localhost \
  STATIC_ROOT=/tmp/workshop-static MEDIA_ROOT=/tmp/workshop-media \
  python manage.py makemigrations --check --dry-run
```

Expected: `No changes detected`, exit 0.

This matters because nothing in this plan was supposed to change a model.
`ReportSerializer.user` became read-only at the serializer, not at the model;
the password validators run in the serializer; the querysets changed how rows
are fetched, not what columns exist. If this command wants to write a migration,
a model changed by accident — find it and revert it. `entrypoint.sh` runs
`migrate` on every deploy, so an unnoticed migration would run against the live
database.

```bash
cd back && git diff main --stat -- api/models.py api/migrations
```

Expected: no output.

- [ ] **Step 5: Build the images the way CI does**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && docker compose build
```

Expected: the `backend` and `frontend` images build.

This is not a formality. Task 10 turned `back/backend/settings.py` into a
directory, and `back/Dockerfile:38` copies `back/` wholesale — if a stale
`settings.pyc` or a missing `__init__.py` broke the package, it surfaces here
rather than during a production deploy. Task 14 changed `package-lock.json`, and
`front/Dockerfile:12` runs `npm ci`, which fails outright on a lockfile that
disagrees with `package.json`.

`docker compose build` reads the `secrets:` block, which points at
`/srv/secrets/workshop/*.txt`. Those paths do not exist on a workstation. Build
does not resolve secrets — only `up` does — so the build succeeds regardless. If
Docker complains about them, build the two services individually with
`docker build -f back/Dockerfile .` and `docker build -f front/Dockerfile .` and
say so in the handover.

- [ ] **Step 6: Confirm the CI workflow still matches the commands**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && grep -n "pytest\|vitest\|ruff\|eslint\|working-directory" .github/workflows/deploy.yml
```

Expected: `python -m pytest -q` under `working-directory: back`,
`npx vitest run` under `working-directory: front`, and the two checker steps
added by Task 15. `DJANGO_SETTINGS_MODULE: backend.settings` must still be
`backend.settings` — Task 10 kept that name deliberately, and a workflow edit
here would mean the split failed to preserve it.

Also confirm the workflow does **not** set `DJANGO_ENV`. CI must run the
development settings, which is what it ran before the split.

- [ ] **Step 7: Confirm `secrets/` was not touched**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git diff main --stat -- secrets/
git diff main -- docker-compose.yml
```

Expected: no output from the first command. The `docker-compose.yml` diff must
show exactly one added line, `DJANGO_ENV: "production"`, in the `backend`
service's `environment:` block, and no change to the `secrets:` block. Spec §6
makes `secrets/` read-only for this cycle.

- [ ] **Step 8: Read the whole diff once**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git diff main --stat
```

Expected shape: a large `docs/` addition; `back/api/views.py` and
`back/api/serializers.py` net **smaller** than they started, because Task 12
deleted more than it added; a new `back/backend/settings/` directory and a
deleted `back/backend/settings.py`; eight new backend test modules; four new
frontend test files; two deleted frontend components; and one very large
formatting commit that `.git-blame-ignore-revs` accounts for.

If `views.py` or `serializers.py` grew, Task 12 did not actually delete the
copies — go back and check.

- [ ] **Step 9: Complete the deferred findings record**

`docs/decisions/0005-deferred-findings.md` must list everything found and not
fixed, each with a reason. At minimum:

- The report modal still sends `user` in its create payload (Task 8, Step 8).
- `CORS_ORIGIN_WHITELIST` was deleted rather than migrated (Task 10, Step 12).
- Pagination is still declared two different ways across the eight viewsets (Task 12, Step 11).
- The zustand stores assign `response.data` straight into state, so a caller who adds `limit` to a route that inherits DRF's pagination would store an object where an array is expected.
- `Report.status` is an unconstrained `CharField` with `choices`; `ReportViewSet` compares it to the literal `'exported'` in two places.
- `Invoice.total_cost` recomputes from tasks and parts on every read, so a historic invoice changes if the task template's price later changes. That is a domain bug, not a performance one, and fixing it means storing the total at export time plus a migration.
- `back/api/models.py:228` carries a commented-out `total_cost` field left over from migration `0009`.
- `Part.save` has an if/else whose two branches are identical (`back/api/models.py:191-198`).
- `back/api/views.py` imports `os` and never uses it; `back/api/serializers.py` imports `datetime`, `now` and `Decimal` — check which survived the ruff sweep.
- The `myapiapp` logger configured in `LOGGING` does not correspond to any app in `INSTALLED_APPS`; the app is called `api`.
- Any remaining `npm audit` findings from Task 14, Step 8.
- Anything surprising found while running the characterization tests in Phase B.

```bash
git add docs/decisions/0005-deferred-findings.md
git commit -m "docs: record what this cycle deliberately left alone"
```

- [ ] **Step 10: Tear down the test database**

```bash
docker rm -f workshop-test-mysql
```

It was created in Task 2 Step 1 and has no purpose after this. Leaving a MySQL
listening on 3306 on a workstation is exactly the kind of thing nobody
remembers.

- [ ] **Step 11: Write the handover summary**

Report to the reviewing session. State:

- Both suite results with test counts, before (Task 2, Steps 3 and 4) and after (Step 1 above).
- The `docker compose build` result.
- The `manage.py check --deploy` result and which warnings remain deliberately.
- The `makemigrations --check` result — this one matters most, because a surprise migration would run against the live database on the next deploy.
- The three security defects fixed and the test module covering each: the unauthenticated user listing (Task 7, `test_users_api.py`), the client-supplied report owner (Task 8, `test_report_ownership.py`), and the unenforced password policy (Task 9, `test_registration_password.py`).
- The query counts before and after for the report and invoice list endpoints (Task 11, Step 3).
- The axios version before and after, and the call-site count from the enumeration table (Task 14, Step 2).
- The formatting sweep SHA.
- The list of deferred findings.
- **One deployment note the reviewer must act on:** `docker-compose.yml` now sets `DJANGO_ENV: "production"` on the backend service. If the reviewer deploys by any route that does not go through that compose file, the backend will load `development.py` and `DEBUG` will follow whatever `/srv/secrets/workshop/back.env` says. Confirm the deploy path is `docker compose up -d`, which `deploy.yml:124` says it is.

- [ ] **Step 12: Push the branch and stop**

```bash
cd "C:/Users/Maria/Desktop/Dev/workshop" && git push -u origin refactor/workshop
```

Do not open a pull request and do not merge to `main`. Per Spec D6 the reviewing
session reads the diff, re-runs the suites, and merges.

---

## Deployment note

Merging to `main` triggers `.github/workflows/deploy.yml`, which runs both
checkers and both suites and then rsyncs to the VPS and rebuilds. After the
reviewing session merges, confirm the live site recovered:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://workshop.santoriello.ch/
curl -sS -o /dev/null -w '%{http_code}\n' https://workshop.santoriello.ch/api/users/
```

Expected: `200` for the frontend, and `401` for the user list. That second
number is the live proof of the Task 7 fix; before this branch it was `200` with
every user's email in the body.

A `000` with exit 60 means the hostname resolved but no traefik router matched.
That is a routing symptom, not a certificate failure — see `docs/runbook.md`
before touching certificates.

If the backend container restarts in a loop after the deploy, the most likely
cause is the settings split: check `docker compose logs backend` for
`ModuleNotFoundError: No module named 'backend.settings'`, which would mean
`back/backend/settings/__init__.py` did not make it into the image.
