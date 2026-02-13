# urls.py
from django.conf import settings
from django.urls import include, path
from django.contrib import admin

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

api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)

# ✅ Sitemap configuration (Wagtail pages)
sitemaps = {
    "jurnal": JurnalSitemap,
    "jurnal-index": JurnalIndexSitemap,
}

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
    path("sitemap.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
]

if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Keep Wagtail catch-all LAST
urlpatterns += [
    path("", include(wagtail_urls)),
]
