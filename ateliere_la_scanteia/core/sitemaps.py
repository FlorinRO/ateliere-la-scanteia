from django.contrib.sitemaps import Sitemap

from core.models import JurnalArticlePage, JurnalIndexPage


class JurnalSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        # Only public/live articles should be indexed
        return JurnalArticlePage.objects.live().public().order_by("-first_published_at")

    def location(self, obj):
        # Wagtail pages already know their URL
        return obj.get_url()


class JurnalIndexSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        # Include the /jurnal/ index page too (if you want it indexed)
        return JurnalIndexPage.objects.live().public()

    def location(self, obj):
        return obj.get_url()
