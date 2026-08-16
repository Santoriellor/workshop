# secrets/

This directory is intentionally empty in version control.

Docker secrets for production are read from `/srv/secrets/workshop/` on the
deployment host, referenced by absolute path in `docker-compose.yml`. They are
never committed.

For local development, create these files here (they are gitignored):

| File | Contents |
|---|---|
| `mysql_root_password.txt` | MySQL root password, no trailing newline |
| `mysql_user.txt` | `django_user` |
| `mysql_password.txt` | Password for `django_user`, no trailing newline |
| `django_secret_key.txt` | Django `SECRET_KEY` |

Use `printf` rather than `echo` when creating them: Docker delivers secret file
contents verbatim, and a trailing newline becomes part of the value.

Note `mysql/init_db.sql` grants privileges to `'django_user'@'%'` by name. If you
change the username, update that file in the same commit or MySQL will fail to
initialise.
