# 0003 — `secrets/` is read-only for this refactor cycle

## Status

Accepted.

## Context

`secrets/README.md` documents that production Docker secrets are never
committed: they are read from `/srv/secrets/workshop/` on the deployment
host, referenced by absolute path in the `secrets:` block of
`docker-compose.yml`. The `secrets:` block declares four file-backed secrets
(`mysql_root_password`, `mysql_user`, `mysql_password`, `django_secret_key`),
each pointing at a file under `/srv/secrets/workshop/`. The `secrets/`
directory in this repository is otherwise empty — it holds only
`secrets/README.md`, which tells a developer which files to create locally
(gitignored) to run the stack outside production.

The estate-level refactor spec (`docs/superpowers/specs/2026-08-22-estate-refactor-design.md`,
§6) names `workshop/secrets/` as a specific risk and states it is treated as
read-only during refactoring: any finding about it is recorded as an ADR
rather than acted on as a code change.

## Decision

This refactor cycle changes neither the contents of `secrets/`, nor
`secrets/README.md`, nor the `secrets:` block in `docker-compose.yml`.

## Finding recorded, not acted on

`read_secret()` (`back/backend/settings/base.py:35-56`, since Task 10 split
`settings.py` into the `settings/` package) resolves a secret's value
by checking an environment variable first and only falling back to the
mounted Docker secret file if that environment variable is unset or empty:

```python
def read_secret(filename, default=None, env=None):
    if env:
        value = os.getenv(env)
        if value:
            return value
    try:
        return (SECRETS_DIR / filename).read_text().strip()
    ...
```

This ordering is deliberate and necessary — it is what lets CI and local
development run without a `/run/secrets` mount at all, supplying
`DJANGO_SECRET_KEY`, `MYSQL_USER` and `MYSQL_PASSWORD` as plain environment
variables instead. But the same ordering means that in *any* environment,
including production, a stray environment variable of the same name silently
wins over the mounted Docker secret, with no warning and no log line. Nothing
in the current deployment sets these variables in production's environment —
`docker-compose.yml`'s `backend` service supplies them only via `secrets:`
and `env_file: /srv/secrets/workshop/back.env` — but the code does not
enforce that separation; it relies on it never being violated. This is
recorded here as a standing observation and is not fixed in this cycle, per
the read-only constraint on `secrets/` and the settings module it feeds.
