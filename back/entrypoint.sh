#!/bin/bash

# Exit on error
set -e

echo "🔍 Checking if /run/secrets directory exists..."
ls -l /run
ls -l /run/secrets || echo "❌ /run/secrets does not exist"

echo "🔍 Checking MySQL password file..."
#if [ -f "/run/secrets/mysql_root_password" ]; then
#  echo "✅ MySQL password secret file found."
#  echo "Root password is: $(cat /run/secrets/mysql_root_password)"
#else
#  echo "❌ MySQL password secret file NOT found!"
#  exit 1
#fi

echo "🔍 Full environment dump:"
printenv

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

# Populate the database
echo "Populating database..."
python manage.py populate_db --all
if [ $? -eq 0 ]; then
    echo "Database populated successfully."
else
    echo "⚠️ populate_db failed or already done."
fi

echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000