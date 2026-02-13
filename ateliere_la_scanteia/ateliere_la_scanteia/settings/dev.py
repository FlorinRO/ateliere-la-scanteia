# dev.py
from .base import *

import os

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# SECURITY WARNING: keep the secret key used in production secret!
# (Dev-only is fine, but production should use env var DJANGO_SECRET_KEY / SECRET_KEY)
SECRET_KEY = "django-insecure-3j+i9%qazy$4*l5n_5d8uy((vngexpqb&q7x3#d-rtg%pkjpvq"

# Dev: allow everything (ok locally)
ALLOWED_HOSTS = ["*"]

# ------------------------------------------------------------
# EMAIL CONFIGURATION (DEV)
# ------------------------------------------------------------
# Use SMTP if credentials exist in .env
# Otherwise fallback to console backend

EMAIL_BACKEND = os.getenv("DJANGO_EMAIL_BACKEND", "").strip()

if not EMAIL_BACKEND:
    if os.getenv("DJANGO_EMAIL_HOST_USER") and os.getenv("DJANGO_EMAIL_HOST_PASSWORD"):
        EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    else:
        EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

EMAIL_HOST = os.getenv("DJANGO_EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("DJANGO_EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("DJANGO_EMAIL_USE_TLS", "1") == "1"
EMAIL_HOST_USER = os.getenv("DJANGO_EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("DJANGO_EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.getenv("DJANGO_EMAIL_TIMEOUT", "20"))

DEFAULT_FROM_EMAIL = os.getenv(
    "DJANGO_DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "no-reply@cowicofi.eu"
)

MEMBRIE_APPLICATION_TO_EMAIL = os.getenv(
    "MEMBRIE_APPLICATION_TO_EMAIL",
    EMAIL_HOST_USER or ""
)

# ------------------------------------------------------------
# CORS (Frontend dev server)
# ------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# ------------------------------------------------------------
# DEV CSRF/COOKIE SETTINGS
# ------------------------------------------------------------
# In dev we keep these relaxed. Production safety is handled in base.py when DEBUG=False.
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False

# If you ever test admin over https locally (ngrok, etc.), you can add origins here:
# CSRF_TRUSTED_ORIGINS = ["https://<your-dev-domain>"]

# ------------------------------------------------------------
# Optional local overrides
# ------------------------------------------------------------
try:
    from .local import *
except ImportError:
    pass
