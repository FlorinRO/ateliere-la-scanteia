# core/admin.py
import csv
import json

from django.contrib import admin
from django.http import HttpResponse

from .models import (
    MembershipApplication,
    MembershipQAItem,
    NewsletterSubscriber,
)


class MembershipQAItemInline(admin.TabularInline):
    model = MembershipQAItem
    extra = 0
    readonly_fields = ("question", "answer", "order")
    can_delete = False


@admin.register(MembershipApplication)
class MembershipApplicationAdmin(admin.ModelAdmin):
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
    list_filter = ("expectation", "source", "created_at")
    search_fields = ("parent_name", "email", "phone", "child_name")
    date_hierarchy = "created_at"
    inlines = [MembershipQAItemInline]
    actions = ["export_csv"]

    def export_csv(self, request, queryset):
        """
        CSV export with:
        - base fields
        - audit fields (ip, user_agent)
        - raw_payload (as JSON string)
        - qa_json (as JSON string)
        - Q&A flattened into columns (Question 1 / Answer 1 ...).
        """
        resp = HttpResponse(content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="membrie_applications.csv"'

        # compute max QA count for header
        max_qa = 0
        for app in queryset:
            cnt = app.qa_items.count()
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
            "ip_address",
            "user_agent",
            "qa_json",
            "raw_payload",
        ]
        for i in range(1, max_qa + 1):
            fieldnames += [f"question_{i}", f"answer_{i}"]

        writer = csv.DictWriter(resp, fieldnames=fieldnames)
        writer.writeheader()

        for app in queryset.prefetch_related("qa_items"):
            row = {
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
                "qa_json": json.dumps(app.qa_json, ensure_ascii=False) if app.qa_json is not None else "",
                "raw_payload": json.dumps(app.raw_payload, ensure_ascii=False) if app.raw_payload is not None else "",
            }

            qa = list(app.qa_items.all())
            for idx, item in enumerate(qa, start=1):
                row[f"question_{idx}"] = item.question
                row[f"answer_{idx}"] = item.answer

            writer.writerow(row)

        return resp

    export_csv.short_description = "Exportă aplicațiile selectate în CSV"


@admin.action(description="Exportă abonații selectați (CSV)")
def export_newsletter_csv(modeladmin, request, queryset):
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="newsletter_subscribers.csv"'

    writer = csv.writer(resp)
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

    for obj in queryset.order_by("-created_at"):
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

    return resp


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "created_at", "confirmed_at", "source")
    list_filter = ("is_active", "source", "created_at")
    search_fields = ("email",)
    date_hierarchy = "created_at"
    actions = [export_newsletter_csv]