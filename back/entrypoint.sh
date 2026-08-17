#!/bin/bash
# Exit on error, and treat a failure anywhere in a pipeline as a failure.
set -euo pipefail

echo "Waiting for MySQL at ${MYSQL_HOST}:${MYSQL_PORT:-3306}..."
while ! nc -z "$MYSQL_HOST" "${MYSQL_PORT:-3306}"; do
  sleep 1
done
echo "MySQL is up."

echo "Applying Django migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Ensuring superuser exists..."
python manage.py createsuperuser --noinput || echo "Superuser already exists - continuing."

# Seeding is opt-in. This previously ran on EVERY deploy, re-seeding demo data
# over the live database each time. Set SEED_DEMO_DATA=true in
# /srv/secrets/workshop/back.env for a one-off reseed, then remove it.
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  echo "SEED_DEMO_DATA=true - populating demo data..."
  # Deliberately tolerant: a failed reseed must not stop the app from serving.
  python manage.py populate_db --all || echo "populate_db failed - continuing without reseed."
else
  echo "SEED_DEMO_DATA is not true - skipping demo data seeding."
fi

echo "Starting Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
