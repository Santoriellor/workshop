#!/bin/bash

# Exit on error
set -e

echo "🔍 Checking if /run/secrets directory exists..."
ls -l /run
ls -l /run/secrets || echo "❌ /run/secrets does not exist"

echo "Waiting for MySQL to be ready..."
while ! nc -z $MYSQL_HOST 3306; do
  sleep 1
done
echo "MySQL is up!"

echo "Applying Django migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Collect static files
echo "Migrate & Createsuperuser"
python manage.py migrate
python manage.py createsuperuser --noinput || echo "Superuser probably already exists"

# Populate the database
echo "Populating database..."
python manage.py populate_db --all
if [ $? -eq 0 ]; then
    echo "Database populated successfully."
else
    echo "⚠️ populate_db failed or already done."
fi

echo "Starting Gunicorn for production..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
