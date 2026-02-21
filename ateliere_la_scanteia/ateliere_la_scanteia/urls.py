# urls.py
import os

from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path
from django.contrib import admin
from django.http import HttpResponse
from django.views.decorators.cache import never_cache

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail import urls as wagtail_urls

from django.contrib.sitemaps.views import sitemap
from core.sitemaps import JurnalSitemap, JurnalIndexSitemap

from search import views as search_views
from core.views import (
    mainpage_content,
    jurnal_list,
    jurnal_detail,
    membrie_application,
    membership_questions,
    robots_txt,
    newsletter_subscribe,
    newsletter_confirm,
)

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)

sitemaps = {
    "jurnal": JurnalSitemap,
    "jurnal-index": JurnalIndexSitemap,
}


@never_cache
def spa_index(request):
    candidates = [
        os.path.join(settings.BASE_DIR, "frontend", "dist", "index.html"),
        os.path.join(settings.BASE_DIR, "frontend", "build", "index.html"),
        os.path.join(settings.BASE_DIR, "static", "index.html"),
    ]

    for p in candidates:
        if os.path.exists(p):
            with open(p, "rb") as f:
                return HttpResponse(f.read(), content_type="text/html")

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

    # ✅ Membrie endpoints
    path("api/membrii/questions/", membership_questions),
    path("api/membrii/applications/", membrie_application),

    # ✅ Newsletter endpoints
    path("api/newsletter/subscribe/", newsletter_subscribe),
    path("api/newsletter/confirm/", newsletter_confirm, name="newsletter-confirm"),

    path("search/", search_views.search, name="search"),

    # ✅ SEO
    path("robots.txt", robots_txt),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),

    # (Optional) Wagtail-rendered pages (kept out of SPA catch-all)
    path("cms/", include(wagtail_urls)),
]

# ✅ Serve MEDIA in production too (important on Railway when no nginx is serving /media)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()

# ✅ SPA fallback — DO NOT hijack /media, /static, /assets (otherwise images become HTML)
urlpatterns += [
    re_path(
        r"^(?!api/|admin/|documents/|django-admin/|sitemap\.xml$|robots\.txt$|media/|static/|assets/|favicon\.ico$).*$",
        spa_index,
    ),
]