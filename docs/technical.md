# Technical

## Prerequisites

- Docker and Docker Compose, for the containerized workflow described in the
  README.
- For running the backend suite outside a container: Python 3.12 and a
  reachable MySQL 8.0 (there is no SQLite fallback —
  `back/backend/settings/base.py` hard-codes `django.db.backends.mysql`).
  `mysqlclient` compiles against the
  MariaDB development headers (`gcc pkg-config libmariadb-dev` on
  Debian/Ubuntu).
- For running the frontend suite outside a container: Node 20.

## Local development

```bash
docker compose up --build
```

builds the backend and frontend images, starts MySQL, and runs migrations
(and, if `SEED_DEMO_DATA=true`, demo data population) via `back/entrypoint.sh`.
The frontend is reachable at `http://localhost` and the backend API at
`http://localhost:8000`.

## Configuration

Environment variables the backend reads, with the file and line each is read
at. `back/backend/settings.py` is now a package (Task 10 of the
`2026-08-22-workshop-refactor` plan): `base.py` holds settings common to
every environment, `development.py` and `production.py` hold the two
environment-specific overrides, and `__init__.py` picks between them based
on `DJANGO_ENV` (unset resolves to development — see
`docs/decisions/0001-settings-split-by-environment.md`):

| Variable | Read at | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | `settings/base.py:70` (env fallback for the `django_secret_key` secret) | Django `SECRET_KEY` |
| `MYSQL_USER` | `settings/base.py:71` (env fallback for the `mysql_user` secret) | Database user |
| `MYSQL_PASSWORD` | `settings/base.py:72` (env fallback for the `mysql_password` secret) | Database password |
| `MYSQL_HOST` | `settings/base.py:29` | Database host |
| `MYSQL_PORT` | `settings/base.py:150` | Database port |
| `MYSQL_DATABASE` | `settings/base.py:146` | Database name; the test database is `test_<name>` |
| `DEBUG` | `settings/development.py:12` | `1`/`true`/`yes` enables debug; anything else disables it. Ignored in production, which hard-codes `DEBUG = False` regardless of this variable (`settings/production.py:13`) |
| `ALLOWED_HOSTS` | `settings/development.py:14`, `settings/production.py:15` | Comma-separated, via the shared `csv_env()` helper |
| `CORS_ALLOWED_ORIGINS` | `settings/development.py:18`, `settings/production.py:16` | Comma-separated via `csv_env()`. Development defaults to `http://localhost:3000` when unset; production has no default and silently resolves to `[]` when unset — see `docs/decisions/0005-deferred-findings.md` |
| `STATIC_ROOT`, `MEDIA_ROOT` | `settings/base.py:200-201` | Overridable so the suite can run outside a container |
| `SEED_DEMO_DATA` | `back/entrypoint.sh:23` | `true` triggers a one-off `populate_db --all` |
| `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` | `back/entrypoint.sh:18` | Consumed by `createsuperuser --noinput` |
| `DJANGO_ENV` | `settings/__init__.py:14` | `production` loads `production.py`; anything else, including unset, loads `development.py` |

The frontend reads exactly one variable, `VITE_API_URL`, from `front/.env`.
That file is committed on purpose — Vite inlines the value into the public
bundle at build time, so there is nothing secret about it.

Local development configures the backend through `back/.env`
(`back/.env.example` documents every key; both are gitignored),
loaded by `load_dotenv()` in `settings/base.py`, deliberately before any
secret is read (`docs/decisions/0001-settings-split-by-environment.md`).

## Secrets

Production reads four Docker secret files from `/srv/secrets/workshop/`
(`mysql_root_password.txt`, `mysql_user.txt`, `mysql_password.txt`,
`django_secret_key.txt`, referenced by absolute path in the `secrets:` block
of `docker-compose.yml`) and the rest of its environment from
`/srv/secrets/workshop/back.env` via `env_file:`. Both live outside the
deploy directory so the deploy rsync cannot touch them. `secrets/` in this
repository holds only `secrets/README.md`, which documents the filenames a
developer must create locally; the directory is otherwise empty and
gitignored. See `docs/decisions/0003-secrets-are-read-only.md` for how
`read_secret()` resolves these values and a finding about it that this
refactor cycle does not act on.

## Running the tests

Backend (the standard command; MySQL must already be reachable at
`127.0.0.1:3306` with a `workshop_db` database and `ci-root-password` as the
root password):

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

`pytest.ini` sets `DJANGO_SETTINGS_MODULE = backend.settings` so pytest-django
can find the settings module during collection.

Frontend:

```bash
npx vitest run
```

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`. A `test` job
installs backend system dependencies (WeasyPrint and `mysqlclient` need
native libraries), runs `python -m pytest -q` against a MySQL 8.0 service
container, then runs `npm ci --legacy-peer-deps` and `npx vitest run` for the
frontend. A `deploy` job depends on `test` (`needs: test`) and additionally
guards `if: github.ref == 'refs/heads/main'`, so both suites must pass before
anything reaches the VPS.

Deployment copies the repository to the VPS with:

```bash
rsync -avz --delete \
  --exclude "nginx/media" \
  --exclude "*.sock" \
  --exclude ".git" \
  --exclude ".github" \
  --exclude "node_modules" \
  --exclude "__pycache__" \
  ./ "$VPS_USER@$VPS_HOST:$VPS_DEPLOY_PATH/"
```

`--delete` makes the server mirror the repository, so a renamed or removed
file no longer lingers on the server after a deploy. `nginx/media` on the
server is excluded because it is a root-owned leftover from an earlier
architecture — nothing in `docker-compose.yml` or `nginx/frontend/nginx.conf`
references it, and rsync cannot remove a root-owned path without root, which
would otherwise fail the whole transfer under `--delete`. It is recorded as
outstanding cleanup requiring root access to the VPS
(`docs/decisions/0005-deferred-findings.md`); it is not something this repository's
tooling can clean up on its own. `*.sock` is excluded because sockets are
runtime artifacts, never repo content. After the copy, the deploy step SSHes
in and runs `docker compose build --no-cache && docker compose up -d`.

## Formatting

Backend (from the repository root):

```bash
pip install -r back/requirements-dev.txt
ruff check back --fix
ruff format back
```

Frontend (from `front/`):

```bash
npx prettier --write "src/**/*.{js,jsx,css}"
npx eslint . --fix
```

Configuration lives in `ruff.toml` (repository root), `front/.prettierrc` and
`front/eslint.config.js`.

Every fresh clone needs one one-time command for `git blame` to skip the
formatting sweep commit (recorded in `.git-blame-ignore-revs`):

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Both checks also run in `.github/workflows/deploy.yml`'s `test` job — `ruff
check`, `ruff format --check` and `eslint . --max-warnings 0` — and a style
failure blocks the `deploy` job the same way a failing test would.
