# core/wagtail_hooks.py
import csv
import json

from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse
from django.urls import path

from wagtail import hooks
from wagtail.admin.viewsets.model import ModelViewSet
from wagtail.admin.menu import MenuItem

from .models import MembershipApplication, NewsletterSubscriber


# ----------------------------------
# Model in Wagtail Admin (Wagtail 6+)
# ----------------------------------
class MembershipApplicationViewSet(ModelViewSet):
    model = MembershipApplication
    icon = "form"
    menu_label = "Aplicații Membrie"
    menu_name = "aplicatii-membrie"
    menu_order = 200

    # REQUIRED in Wagtail 6+: declare form fields
    form_fields = (
        "created_at",
        "parent_name",
        "phone",
        "email",
        "child_name",
        "child_age",
        "expectation",
        "source",
        "art_relationship",
        "qa_json",
        "ip_address",
        "user_agent",
        "raw_payload",
    )

    list_display = (
        "created_at",
        "parent_name",
        "email",
        "phone",
        "child_name",
        "child_age",
        "expectation",
        "source",
        "ip_address",
    )

    list_filter = ("expectation", "source")
    search_fields = ("parent_name", "email", "phone", "child_name")


@hooks.register("register_admin_viewset")
def register_membership_viewset():
    return MembershipApplicationViewSet("membrie")


# ----------------------------------
# Helpers
# ----------------------------------
def _qa_to_pairs(app: MembershipApplication):
    """
    Returns list[(question, answer)] from:
      - qa_json (preferred) OR
      - raw_payload.qa_items
    Keeps the order as stored.
    """
    qa = app.qa_json
    if not qa and isinstance(app.raw_payload, dict):
        qa = app.raw_payload.get("qa_items")

    if not isinstance(qa, list):
        return []

    out = []
    for item in qa:
        if not isinstance(item, dict):
            continue
        q = str(item.get("question") or "").strip()
        a = str(item.get("answer") or "").strip()
        if q:
            out.append((q, a))
    return out


# ----------------------------------
# CSV Export URLs in Wagtail Admin
# ----------------------------------
@hooks.register("register_admin_urls")
def register_export_csv_urls():
    @staff_member_required
    def export_csv_ordered(request):
        """
        Ordered, human-readable CSV:
        - Base fields
        - Q&A as Q1/A1, Q2/A2 ... (shows both question AND answer)
        - No raw_payload / user_agent by default (clean)
        """
        queryset = MembershipApplication.objects.all().order_by("-created_at")

        # compute max QA count for header
        max_qa = 0
        for app in queryset:
            cnt = len(_qa_to_pairs(app))
            if cnt > max_qa:
                max_qa = cnt

        fieldnames = [
            "created_at",
            "parent_name",
            "phone",
            "email",
            "child_name",
            "child_age",
            "expectation",
            "source",
        ]
        for i in range(1, max_qa + 1):
            fieldnames += [f"Q{i}", f"A{i}"]

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="membrie_applications_ordered.csv"'

        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()

        for app in queryset:
            row = {
                "created_at": app.created_at.isoformat() if app.created_at else "",
                "parent_name": app.parent_name,
                "phone": app.phone,
                "email": app.email,
                "child_name": app.child_name,
                "child_age": app.child_age,
                "expectation": app.expectation,
                "source": app.source,
            }

            qa = _qa_to_pairs(app)
            for idx, (q, a) in enumerate(qa, start=1):
                row[f"Q{idx}"] = q
                row[f"A{idx}"] = a

            writer.writerow(row)

        return response

    @staff_member_required
    def export_csv_full(request):
        """
        FULL/AUDIT CSV:
        - Includes audit + JSON blobs for debugging
        """
        queryset = MembershipApplication.objects.all().order_by("-created_at")

        fieldnames = [
            "created_at",
            "parent_name",
            "phone",
            "email",
            "child_name",
            "child_age",
            "expectation",
            "source",
            "ip_address",
            "user_agent",
            "art_relationship",
            "qa_json",
            "raw_payload",
        ]

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="membrie_applications_full.csv"'

        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()

        for app in queryset:
            writer.writerow(
                {
                    "created_at": app.created_at.isoformat() if app.created_at else "",
                    "parent_name": app.parent_name,
                    "phone": app.phone,
                    "email": app.email,
                    "child_name": app.child_name,
                    "child_age": app.child_age,
                    "expectation": app.expectation,
                    "source": app.source,
                    "ip_address": app.ip_address or "",
                    "user_agent": app.user_agent or "",
                    "art_relationship": app.art_relationship or "",
                    "qa_json": json.dumps(app.qa_json, ensure_ascii=False) if app.qa_json is not None else "",
                    "raw_payload": json.dumps(app.raw_payload, ensure_ascii=False) if app.raw_payload is not None else "",
                }
            )

        return response

    # ----------------------------
    # ✅ Newsletter CSV exports
    # ----------------------------
    @staff_member_required
    def export_newsletter_csv_all(request):
        """
        Newsletter CSV (ALL subscribers)
        """
        queryset = NewsletterSubscriber.objects.all().order_by("-created_at")

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="newsletter_subscribers_all.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "email",
                "is_active",
                "created_at",
                "confirmed_at",
                "source",
                "ip_address",
                "user_agent",
            ]
        )

        for obj in queryset:
            writer.writerow(
                [
                    obj.email,
                    obj.is_active,
                    obj.created_at.isoformat() if obj.created_at else "",
                    obj.confirmed_at.isoformat() if obj.confirmed_at else "",
                    obj.source,
                    obj.ip_address or "",
                    obj.user_agent or "",
                ]
            )

        return response

    @staff_member_required
    def export_newsletter_csv_active(request):
        """
        Newsletter CSV (ONLY confirmed/active subscribers)
        """
        queryset = NewsletterSubscriber.objects.filter(is_active=True).order_by(
            "-confirmed_at", "-created_at"
        )

        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="newsletter_subscribers_active.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "email",
                "is_active",
                "created_at",
                "confirmed_at",
                "source",
                "ip_address",
                "user_agent",
            ]
        )

        for obj in queryset:
            writer.writerow(
                [
                    obj.email,
                    obj.is_active,
                    obj.created_at.isoformat() if obj.created_at else "",
                    obj.confirmed_at.isoformat() if obj.confirmed_at else "",
                    obj.source,
                    obj.ip_address or "",
                    obj.user_agent or "",
                ]
            )

        return response

    return [
        # Membrie exports
        path("membrie/export-csv/", export_csv_ordered, name="membrie_export_csv_ordered"),
        path("membrie/export-csv-full/", export_csv_full, name="membrie_export_csv_full"),
        # Newsletter exports
        path("newsletter/export-csv/", export_newsletter_csv_all, name="newsletter_export_csv_all"),
        path("newsletter/export-csv-active/", export_newsletter_csv_active, name="newsletter_export_csv_active"),
    ]


# ----------------------------------
# Add Export items in Wagtail Settings menu
# ----------------------------------
@hooks.register("register_settings_menu_item")
def register_export_ordered_menu_item():
    return MenuItem(
        "Export Membrie CSV (Ordonat Q/A)",
        "/admin/membrie/export-csv/",
        icon_name="download",
        order=201,
    )


@hooks.register("register_settings_menu_item")
def register_export_full_menu_item():
    return MenuItem(
        "Export Membrie CSV (Full/Audit)",
        "/admin/membrie/export-csv-full/",
        icon_name="download",
        order=202,
    )


@hooks.register("register_settings_menu_item")
def register_export_newsletter_all_menu_item():
    return MenuItem(
        "Export Newsletter CSV (All)",
        "/admin/newsletter/export-csv/",
        icon_name="download",
        order=203,
    )


@hooks.register("register_settings_menu_item")
def register_export_newsletter_active_menu_item():
    return MenuItem(
        "Export Newsletter CSV (Active)",
        "/admin/newsletter/export-csv-active/",
        icon_name="download",
        order=204,
    )