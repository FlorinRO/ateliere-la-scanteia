# urls.py
from django.conf import settings
from django.urls import include, path, re_path
from django.contrib import admin
from django.http import HttpResponse
from django.views.decorators.cache import never_cache

from wagtail.admin import urls as wagtailadmin_urls
from wagtail import urls as wagtail_urls
from wagtail.documents import urls as wagtaildocs_urls

from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter

from django.contrib.sitemaps.views import sitemap
from core.sitemaps import JurnalSitemap, JurnalIndexSitemap

from search import views as search_views
from core.views import (
    mainpage_content,
    jurnal_list,
    jurnal_detail,
    membrie_application,
    robots_txt,
)

import os

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)

# ✅ Sitemap configuration (Wagtail pages)
sitemaps = {
    "jurnal": JurnalSitemap,
    "jurnal-index": JurnalIndexSitemap,
}

# -----------------------------
# ✅ React SPA index fallback
# -----------------------------
@never_cache
def spa_index(request):
    """
    Serves React build index.html for all non-API / non-admin routes.
    Works only if you have a built frontend inside Django container.
    """
    # Adjust this path to wherever your React build ends up inside Docker.
    # Common: /app/frontend/dist/index.html or /app/frontend/build/index.html
    candidates = [
        os.path.join(settings.BASE_DIR, "frontend", "dist", "index.html"),
        os.path.join(settings.BASE_DIR, "frontend", "build", "index.html"),
        os.path.join(settings.BASE_DIR, "static", "index.html"),
    ]

    for p in candidates:
        if os.path.exists(p):
            with open(p, "rb") as f:
                return HttpResponse(f.read(), content_type="text/html")

    # If build missing, show something readable
    return HttpResponse(
        "React build index.html not found. Build/deploy frontend bundle first.",
        status=500,
        content_type="text/plain",
    )


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),

    # Wagtail API
    path("api/v2/", api_router.urls),

    # Headless endpoint for React
    path("api/mainpage/", mainpage_content),

    # ✅ Jurnal endpoints (headless for React)
    path("api/jurnal/", jurnal_list),
    path("api/jurnal/<slug:slug>/", jurnal_detail),

    # ✅ Membrie endpoint (form submit → email)
    path("api/membrii/applications/", membrie_application),

    path("search/", search_views.search, name="search"),

    # ✅ SEO
    path("robots.txt", robots_txt),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ✅ Serve React for EVERYTHING else (including /jurnal/...)
urlpatterns += [
    re_path(r"^(?!api/|admin/|documents/|django-admin/|sitemap\.xml$|robots\.txt$).*$", spa_index),
]

# OPTIONAL: keep wagtail_urls only if you still need Wagtail-rendered pages somewhere.
# If you are fully headless, you can REMOVE this.
urlpatterns += [
    path("", include(wagtail_urls)),
]
