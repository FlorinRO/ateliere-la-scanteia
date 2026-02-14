#!/usr/bin/env sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static..."
python manage.py collectstatic --noinput --clear

# Optional: create superuser once (won't crash if it already exists)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
  echo "Ensuring superuser exists..."
  python manage.py createsuperuser --noinput || true
fi

echo "Starting gunicorn on port ${PORT:-8000}..."
exec gunicorn ateliere_la_scanteia.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2}
