# Architecture

## Overview

Workshop is a Django 5.1 + Django REST Framework backend paired with a React 19
frontend built by Vite, backed by MySQL. Three containers — `backend`,
`frontend`, `mysql` — are built and run by `docker-compose.yml` and served in
production behind traefik at `workshop.santoriello.ch`.

## Components

- **`api`** — the single Django app. It is mounted at `/api/` by
  `back/backend/urls.py:26` (`path("api/", include("api.urls"))`). All
  models, views, serializers and business logic for the product live here;
  there is no second app.
- **`backend`** — the Django project package: settings, root URLconf, WSGI
  entrypoint.
- **`front`** — the React 19 SPA, built by Vite and served as static files.
- **`mysql`** — MySQL 8.0, the only datastore. There is no SQLite fallback
  anywhere in settings.

## Request flow

Two function-style authentication endpoints sit outside the router:
`POST /api/register/` and `POST /api/login/` (`back/api/urls.py:31-32`), plus
SimpleJWT's own `POST /api/token/refresh/`. `login/` returns an access and a
refresh JWT and the caller's serialized user data; `register/` creates a user.

Everything else is routed through a single DRF `DefaultRouter`
(`back/api/urls.py:19-27`), which registers eight viewsets:

| Path | ViewSet |
|---|---|
| `users` | `UserViewSet` |
| `profile` | `UserProfileViewSet` |
| `owners` | `OwnerViewSet` |
| `vehicles` | `VehicleViewSet` |
| `reports` | `ReportViewSet` |
| `task-templates` | `TaskTemplateViewSet` |
| `inventory` | `InventoryViewSet` |
| `invoices` | `InvoiceViewSet` |

**Authentication** is JWT only: `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`
in `back/backend/settings/base.py` lists exactly
`rest_framework_simplejwt.authentication.JWTAuthentication` — no session or
basic auth. Access tokens live 20 minutes, refresh tokens live 1 day, and
refresh tokens rotate (`ROTATE_REFRESH_TOKENS = True`, `SIMPLE_JWT` in
`settings/base.py`). `back/backend/settings.py` is no longer a file: it is a
package (`back/backend/settings/__init__.py`, `base.py`, `development.py`,
`production.py`) selected by the `DJANGO_ENV` environment variable — see
`docs/decisions/0001-settings-split-by-environment.md`.

**Permissions.** `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']` is
`IsAuthenticated`, but every viewset re-declares `permission_classes` on the
class anyway rather than relying on the default. That redundancy is exactly
why one viewset was able to disable authentication silently by overriding it
with an empty list — see `docs/decisions/0002-permission-baseline.md` for the
finding and its fix.

**Pagination.** `DEFAULT_PAGINATION_CLASS` is `LimitOffsetPagination` with no
page size configured, so a plain list request returns a bare JSON array
unless the caller sends `limit` or `offset`. Three viewsets
(`ReportViewSet`, `InventoryViewSet`, `InvoiceViewSet`) opt out of it
(`pagination_class = None`) and instead mix in `OptionalPaginationMixin`
(`back/api/mixins.py`), which centralizes the behaviour that used to be
hand-rolled identically in each viewset's own `list()`: only paginate (via
`CustomPagination`, `back/api/pagination.py`, `default_limit = 5`) when the
request supplies `limit` or `offset`, otherwise return every row unpaginated.
The other four viewsets (`OwnerViewSet`, `VehicleViewSet`, `UserViewSet`,
`UserProfileViewSet`) still inherit `LimitOffsetPagination` directly, so
pagination is declared two different ways across the eight viewsets — see
`docs/decisions/0005-deferred-findings.md`.

**Invoicing.** Invoices are not requested directly; they are a side effect.
When a `Report` update transitions `status` to `"exported"`
(`back/api/views.py:236-241`, inside `ReportViewSet.update`), the view calls
`generate_invoice()`, which creates an `Invoice` row and renders it to PDF
with WeasyPrint (`back/api/services/invoices.py`). The PDF is written under
`MEDIA_ROOT/invoices/` and attached to the `Invoice.pdf` field.

## Persistence

MySQL 8.0 is the only database. The container mounts a named volume
(`mysql_volume`) for `/var/lib/mysql` and a read-only bind mount for
`mysql/init_db.sql`, which is applied once, on first initialization only, by
MySQL's own `docker-entrypoint-initdb.d` mechanism (it grants privileges to
`'django_user'@'%'` by name).

## Deployment topology

- **frontend** — the Vite build, served by `nginxinc/nginx-unprivileged` on
  port 8080 (unprivileged nginx cannot bind below 1024). The same nginx also
  serves `/media/` and `/static_django/` by aliasing them to
  `/backend/media/` and `/backend/staticfiles/` — the `media_volume` and
  `static_volume` Docker volumes, shared read-only with the backend container
  (`nginx/frontend/nginx.conf`).
- **backend** — Django under Gunicorn on port 8000.
- **mysql** — reachable only from the backend, on the `internal` network.
- **traefik** (outside this repository) terminates TLS and routes by host and
  path: `Host(\`workshop.santoriello.ch\`)` to the frontend, and
  `Host(\`workshop.santoriello.ch\`) && PathPrefix(\`/api\`)` to the backend on
  port 8000 (`docker-compose.yml:65` and `:104`).
- Two Docker networks: `internal` (backend + mysql, declared
  `internal: true` so nothing on the `proxy-network` — including traefik —
  can reach MySQL directly) and `proxy-network` (backend + frontend, external,
  shared with traefik).

```
                 traefik (TLS, host+path routing)
                 /                              \
   Host(workshop...)                Host(workshop...) && PathPrefix(/api)
                 |                                |
           frontend:8080                    backend:8000
        (nginx-unprivileged)                  (Gunicorn)
                 |         \___________________/  |
        static_volume,           proxy-network     |
        media_volume (ro)                     internal network
                                                    |
                                              mysql:3306
                                        (internal only, not
                                         reachable from proxy)
```
