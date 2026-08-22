[![CI](https://github.com/Santoriellor/workshop/actions/workflows/deploy.yml/badge.svg)](https://github.com/Santoriellor/workshop/actions/workflows/deploy.yml)

# Workshop

Workshop is a vehicle-workshop management app: it tracks owners, vehicles,
service reports, task templates, parts inventory and the invoices generated
from completed reports. The backend is Django 5.1 + Django REST Framework
with MySQL; the frontend is React 19 built by Vite.

## Run it locally

```bash
docker compose up --build
```

This builds the backend and frontend containers, sets up MySQL, and runs
Django migrations via `back/entrypoint.sh`. Then:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Backend Django Admin**: http://localhost:8000/admin/

## Running the tests

Backend (the suite is pytest, not `manage.py test`; `pytest.ini` sets
`DJANGO_SETTINGS_MODULE`, and `.github/workflows/deploy.yml` runs the same
command in CI). A MySQL 8.0 instance must be reachable first — see
`docs/technical.md` for how to start one:

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

Frontend:

```bash
cd front && npm ci --legacy-peer-deps && npx vitest run
```

## Configuration

No credentials are stored in this repository.

**Local development:** copy `back/.env.example` to `back/.env` and fill in
your own values, then create the files listed in `secrets/README.md`. Both
paths are gitignored.

**Production:** secrets live on the deployment host at
`/srv/secrets/workshop/`, outside the deploy directory so the deployment
rsync cannot overwrite them. `docker-compose.yml` references them by
absolute path — Docker secrets for the database and Django keys, and
`env_file` for the rest.

`front/.env` *is* committed deliberately: it contains only `VITE_API_URL`,
which Vite inlines into the public browser bundle at build time.

## Documentation

Detail lives in `docs/`, not here:

- [`docs/architecture.md`](docs/architecture.md) — components, request flow, deployment topology
- [`docs/design.md`](docs/design.md) — domain model, report lifecycle, invoicing, authentication model
- [`docs/technical.md`](docs/technical.md) — configuration, environment variables, secrets, CI/CD
- [`docs/runbook.md`](docs/runbook.md) — logs, backups, restore, common incidents
- [`docs/decisions/`](docs/decisions/) — architecture decision records, including deliberately deferred findings

The project's original write-up and presentation materials are kept in
[`docs/reference/`](docs/reference/).
