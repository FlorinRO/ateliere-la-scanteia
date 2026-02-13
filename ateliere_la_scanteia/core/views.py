# views.py
import json

from django.conf import settings
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import JsonResponse
from django.utils.html import strip_tags
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.template.loader import render_to_string
from .models import MainPageContent, JurnalIndexPage, JurnalArticlePage



def robots_txt(request):
    content = render_to_string("robots.txt")
    return HttpResponse(content, content_type="text/plain")


def mainpage_content(request):
    """
    JSON endpoint for React frontend.
    Returns editable main page content from Wagtail Settings (MainPageContent).
    """
    content = MainPageContent.for_request(request)

    return JsonResponse(
        {
            "hero": {
                "kicker": content.hero_kicker,
                "title": content.hero_title,
                "subtitle": content.hero_subtitle,
                "bg_image": content.hero_bg_image.file.url if content.hero_bg_image else None,
            },
            "spatiul": {
                "label": content.spatiul_label,
                "title": content.spatiul_title,
                "paragraph": content.spatiul_paragraph,
                "image_1": content.spatiul_image_1.file.url if content.spatiul_image_1 else None,
                "quote": content.spatiul_quote,
                "stats": [
                    {"value": content.spatiul_stat_1_value, "label": content.spatiul_stat_1_label},
                    {"value": content.spatiul_stat_2_value, "label": content.spatiul_stat_2_label},
                    {"value": content.spatiul_stat_3_value, "label": content.spatiul_stat_3_label},
                ],
            },
            "filosofie": {
                "label": content.filosofie_label,
                "title_line_1": content.filosofie_title_line_1,
                "title_line_2": content.filosofie_title_line_2,
                "intro": content.filosofie_intro,
                "paragraph_1": content.filosofie_paragraph_1,
                "paragraph_2": content.filosofie_paragraph_2,
                "cta_text": content.filosofie_cta_text,
                "image_2": content.filosofie_image_2.file.url if content.filosofie_image_2 else None,
                "quote": content.filosofie_quote,
            },
            "testimoniale": {
                "title": content.testimoniale_title,
                "items": [
                    {"quote": content.testimonial_1_quote, "name": content.testimonial_1_name, "role": content.testimonial_1_role},
                    {"quote": content.testimonial_2_quote, "name": content.testimonial_2_name, "role": content.testimonial_2_role},
                    {"quote": content.testimonial_3_quote, "name": content.testimonial_3_name, "role": content.testimonial_3_role},
                    {"quote": content.testimonial_4_quote, "name": content.testimonial_4_name, "role": content.testimonial_4_role},
                    {"quote": content.testimonial_5_quote, "name": content.testimonial_5_name, "role": content.testimonial_5_role},
                ],
            },
            "manifest": {
                "label": content.manifest_label,
                "title": content.manifest_title,
                "text": content.manifest_text,
                "cards": [
                    {"title": content.manifest_card_1_title, "text": content.manifest_card_1_text},
                    {"title": content.manifest_card_2_title, "text": content.manifest_card_2_text},
                    {"title": content.manifest_card_3_title, "text": content.manifest_card_3_text},
                ],
            },
        }
    )


def _get_jurnal_index():
    return JurnalIndexPage.objects.live().public().first()


def jurnal_list(request):
    """
    GET /api/jurnal/
    """
    index = _get_jurnal_index()
    if not index:
        return JsonResponse({"index": None, "items": []})

    items_qs = (
        JurnalArticlePage.objects.child_of(index)
        .live()
        .public()
        .order_by("-first_published_at")
    )

    items = []
    for p in items_qs:
        items.append(
            {
                "slug": p.slug,
                "category": p.category,
                "title": p.title,
                "image": p.hero_image.file.url if p.hero_image else None,
                "excerpt": p.excerpt,
                "meta": p.meta,
            }
        )

    return JsonResponse(
        {
            "index": {
                "label": index.label,
                "title": index.title,
                "subtitle": index.subtitle,
                "intro": index.intro,
            },
            "items": items,
        }
    )


def jurnal_detail(request, slug):
    """
    GET /api/jurnal/<slug>/
    """
    index = _get_jurnal_index()
    if not index:
        return JsonResponse({"detail": None}, status=404)

    page = (
        JurnalArticlePage.objects.child_of(index)
        .live()
        .public()
        .filter(slug=slug)
        .first()
    )
    if not page:
        return JsonResponse({"detail": None}, status=404)

    return JsonResponse(
        {
            "detail": {
                "slug": page.slug,
                "category": page.category,
                "title": page.title,
                "image": page.hero_image.file.url if page.hero_image else None,
                "excerpt": page.excerpt,
                "meta": page.meta,
                "body_html": str(page.body) if page.body else "",
            }
        }
    )


# ------------------------------------------------------------
# Membership application view
# ------------------------------------------------------------
@csrf_exempt
def membrie_application(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required = [
        "parent_name",
        "phone",
        "email",
        "child_name",
        "child_age",
        "art_relationship",
        "expectation",
    ]
    missing = [k for k in required if not str(data.get(k, "")).strip()]
    if missing:
        return JsonResponse(
            {"error": "Missing required fields.", "fields": missing}, status=400
        )

    parent_name = data["parent_name"].strip()
    phone = data["phone"].strip()
    email = data["email"].strip()
    child_name = data["child_name"].strip()
    child_age = data["child_age"].strip()
    art_relationship = data["art_relationship"].strip()
    expectation = data["expectation"].strip()
    source = data.get("source", "").strip() or "website"

    try:
        validate_email(email)
    except Exception:
        return JsonResponse({"error": "Email invalid."}, status=400)

    if expectation not in ("hobby", "performance"):
        return JsonResponse(
            {"error": "Expectation must be 'hobby' or 'performance'."}, status=400
        )

    expectation_label = "Hobby" if expectation == "hobby" else "Performanță"

    to_email = getattr(settings, "MEMBRIE_APPLICATION_TO_EMAIL", "") or ""
    if not to_email:
        return JsonResponse(
            {"error": "Server is not configured with a destination email."}, status=500
        )

    subject = f"[Membrie] Aplicație nouă – {parent_name} / {child_name}"

    # Plain text version
    message = (
        "A fost trimisă o aplicație nouă (Membrie):\n\n"
        f"Părinte: {parent_name}\n"
        f"Telefon: {phone}\n"
        f"Email: {email}\n\n"
        f"Copil: {child_name}\n"
        f"Vârsta: {child_age}\n\n"
        "Relația cu arta:\n"
        f"{art_relationship}\n\n"
        f"Așteptări: {expectation_label}\n"
        f"Sursa: {source}\n"
    )

    # HTML version (uses template)
    context = {
        "parent_name": parent_name,
        "phone": phone,
        "email": email,
        "child_name": child_name,
        "child_age": child_age,
        "art_relationship": art_relationship,
        "expectation_label": expectation_label,
        "source": source,
        "submitted_at": timezone.localtime().strftime("%d %b %Y, %H:%M"),
    }

    html_message = render_to_string(
        "emails/membrie_application.html",
        context,
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=[to_email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception as e:
        return JsonResponse(
            {"error": "Failed to send email.", "detail": str(e)}, status=500
        )

    return JsonResponse({"ok": True}, status=201)
