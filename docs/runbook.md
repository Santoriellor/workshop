# Runbook

## Where the logs are

All three containers log to stdout/stderr, so `docker compose logs` (or
`docker logs <container>`) is the entry point in every environment:

- `backend` — Gunicorn's own request/error logs, plus Django's `LOGGING`
  configuration in `settings/base.py` (`back/backend/settings.py` is a
  package since Task 10 — see
  `docs/decisions/0001-settings-split-by-environment.md`), which sends the
  `django` and `myapiapp` loggers to a console handler at `INFO`. The
  `myapiapp` logger name is stale and matches no app in `INSTALLED_APPS` —
  the app is called `api` — so nothing in this codebase currently logs
  through it; see `docs/decisions/0005-deferred-findings.md`.
- `frontend` — nginx access/error logs are explicitly redirected to
  `/dev/stdout` for the `/media/` and `/static_django/` locations
  (`nginx/frontend/nginx.conf`), because the unprivileged nginx image
  (uid 101) cannot create files under `/var/log/nginx`.
- `mysql` — standard MySQL container logs.

## Backing up `mysql_volume`

`mysql_volume` is a named Docker volume with no host bind mount, so back it
up by running a throwaway container against the volume:

```bash
docker run --rm \
  -v mysql_volume:/var/lib/mysql \
  -v "$(pwd)":/backup \
  alpine tar czf /backup/mysql_volume_backup.tar.gz -C /var/lib/mysql .
```

Take this before any operation that could touch the volume (upgrades,
`docker compose down -v`, retirement work on the shared infrastructure).

## Restoring

Stop the stack, restore the archive into the (empty) named volume, then start
again:

```bash
docker compose down
docker run --rm \
  -v mysql_volume:/var/lib/mysql \
  -v "$(pwd)":/backup \
  alpine sh -c "rm -rf /var/lib/mysql/* && tar xzf /backup/mysql_volume_backup.tar.gz -C /var/lib/mysql"
docker compose up -d
```

## Backend refuses to start

Two failure modes are known:

1. **`entrypoint.sh` blocks forever in its `nc -z` loop.** The script waits
   for `MYSQL_HOST:MYSQL_PORT` to accept a TCP connection before doing
   anything else (`back/entrypoint.sh:5-8`). If MySQL never becomes healthy —
   wrong host/port, MySQL crash-looping, `mysql` service unhealthy so
   `depends_on: condition: service_healthy` never releases the backend — the
   backend container just sits there printing "Waiting for MySQL...". Check
   `docker compose ps` for the `mysql` service's health status and
   `docker compose logs mysql` for why its healthcheck is failing.
2. **Settings raise before Django even starts.** `read_secret()`
   (`back/backend/settings/base.py`) raises for `DJANGO_SECRET_KEY`,
   `MYSQL_USER` or `MYSQL_PASSWORD` if a value is neither a mounted Docker
   secret under `/run/secrets/` nor set as the corresponding environment
   variable. The container exits immediately and `docker compose logs
   backend` shows a Python traceback, not a running server.

   This used to also be true of `CORS_ALLOWED_ORIGINS`, which was read with a
   bare `os.getenv('CORS_ALLOWED_ORIGINS').split(',')` that raised
   `AttributeError` at import when the variable was unset. Task 10 replaced
   that with `csv_env()`, so an unset `CORS_ALLOWED_ORIGINS` no longer
   crashes the container — see
   `docs/decisions/0001-settings-split-by-environment.md`. It is not risk-free
   in its new form: development defaults to `http://localhost:3000`, but
   production has no default and an unset variable there now resolves
   silently to `CORS_ALLOWED_ORIGINS = []` instead of failing loudly. If the
   frontend origin is mysteriously getting CORS-rejected in production with
   no error anywhere, check that `CORS_ALLOWED_ORIGINS` is actually set in
   `/srv/secrets/workshop/back.env` — see
   `docs/decisions/0005-deferred-findings.md`.

## Media and static files are missing

`static_volume` and `media_volume` are both mounted read-write into the
`backend` container and read-only into the `frontend` container
(`docker-compose.yml:40-41,87-88`). `collectstatic --noinput` runs on every
backend start (`back/entrypoint.sh:14-15`), so static files should always be
current after a successful backend startup. If `/static_django/` or `/media/`
404 from the frontend:

- Confirm the backend container actually started successfully (see above) —
  `collectstatic` never ran if it didn't.
- Confirm both volumes are attached to both containers (`docker compose ps`,
  `docker inspect`).
- For media specifically, remember `MEDIA_ROOT` defaults to `/backend/media`
  only when the `MEDIA_ROOT` environment variable is unset; a value set for
  local/test runs outside a container will silently redirect where files are
  written and read from.

## Certificate or hostname problems

This project is served at `workshop.santoriello.ch`. traefik answers any
hostname it has no router for with its default (self-signed/fallback)
certificate rather than an error, which curl reports as **exit 60**
(certificate verification failure). If `curl https://workshop.santoriello.ch/`
returns exit 60, treat it first as a symptom of a **missing or misconfigured
router** — check the `traefik.http.routers.workshop-*.rule` labels in
`docker-compose.yml` and that the container is actually running and attached
to `proxy-network` — not as evidence that the TLS certificate itself is
broken.
