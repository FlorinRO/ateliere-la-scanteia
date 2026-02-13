# Use an official Python runtime based on Debian 12 "bookworm" as a parent image.
FROM python:3.12-slim-bookworm

# Add user that will be used in the container.
RUN useradd -m wagtail

# Port used by this container to serve HTTP.
EXPOSE 8000

# Set environment variables.
# 1. Force Python stdout and stderr streams to be unbuffered.
# 2. Default PORT (we will still bind to 8000 explicitly to avoid $PORT issues).
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system packages required by Wagtail and Django.
RUN apt-get update --yes --quiet && apt-get install --yes --quiet --no-install-recommends \
    build-essential \
    libpq-dev \
    libmariadb-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libwebp-dev \
 && rm -rf /var/lib/apt/lists/*

# ✅ Ensure setuptools is available (pkg_resources) and keep tooling up-to-date.
# This fixes: ModuleNotFoundError: No module named 'pkg_resources'
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# ✅ Install the application server (newer Gunicorn is safer on modern Python).
RUN pip install --no-cache-dir "gunicorn>=21.2,<23"

# Install the project requirements.
COPY requirements.txt /
RUN pip install --no-cache-dir -r /requirements.txt

# Use /app folder as a directory where the source code is stored.
WORKDIR /app

# Copy the source code of the project into the container.
COPY . .

# Make sure files are owned by wagtail (important for sqlite, media, etc.)
RUN chown -R wagtail:wagtail /app

# Ensure entrypoint is executable (so you DON'T need to run chmod locally).
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user.
USER wagtail

# Collect static files.
RUN python manage.py collectstatic --noinput --clear

# Use entrypoint to run migrations then start gunicorn.
CMD ["/app/entrypoint.sh"]
