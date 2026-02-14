# views.py
import json

from django.conf import settings
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string

from .models import MainPageContent, JurnalIndexPage, JurnalArticlePage


def robots_txt(request):
    content = render_to_string("robots.txt")
    return HttpResponse(content, content_type="text/plain")


def _img_url(img):
    try:
        return img.file.url if img else None
    except Exception:
        return None


def _get_jurnal_index():
    return JurnalIndexPage.objects.live().public().first()


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
                "bg_image": _img_url(content.hero_bg_image),
            },
            "spatiul": {
                "label": content.spatiul_label,
                "title": content.spatiul_title,
                "paragraph": content.spatiul_paragraph,

                # ✅ NEW (you added in models)
                "seo_blurb": content.spatiul_seo_blurb,
                "hidden_keywords": content.spatiul_hidden_keywords,

                "image_1": _img_url(content.spatiul_image_1),
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
                "image_2": _img_url(content.filosofie_image_2),
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


def _article_images(page: JurnalArticlePage):
    """
    Returns: [hero, gallery...], unique, ordered.
    """
    out = []
    hero = _img_url(page.hero_image)
    if hero:
        out.append(hero)

    # gallery images via Orderable relation
    try:
        for gi in page.gallery_images.all():
            u = _img_url(gi.image)
            if u and u not in out:
                out.append(u)
    except Exception:
        pass

    return out


def _article_videos(page: JurnalArticlePage):
    """
    StreamField -> list of url strings.
    Supports blocks named "video".
    """
    urls = []
    try:
        if page.videos:
            for blk in page.videos:
                if blk.block_type == "video":
                    u = (blk.value or "").strip()
                    if u:
                        urls.append(u)
    except Exception:
        pass
    return urls


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
        images = _article_images(p)
        videos = _article_videos(p)

        items.append(
            {
                "slug": p.slug,
                "category": p.category,
                "title": p.title,

                # compat cu frontend-ul actual
                "image": _img_url(p.hero_image),

                # ✅ NEW for gallery + cards carousel
                "images": images,
                "videos": videos,

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

    images = _article_images(page)
    videos = _article_videos(page)

    return JsonResponse(
        {
            "detail": {
                "slug": page.slug,
                "category": page.category,
                "title": page.title,

                # compat
                "image": _img_url(page.hero_image),

                # ✅ NEW
                "images": images,
                "videos": videos,

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

    html_message = render_to_string("emails/membrie_application.html", context)

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
