# core/views.py
import json
import re
import secrets

from django.conf import settings
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string
from django.urls import reverse
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from .models import (
    MainPageContent,
    MembrieFormContent,
    JurnalIndexPage,
    JurnalArticlePage,
    MembershipApplication,
    MembershipQAItem,
    NewsletterSubscriber,  # ✅ NEW
)


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
    content = MainPageContent.for_request(request)

    s1_sub = getattr(content, "spatiul_stat_1_sublabel", "") or ""
    s2_sub = getattr(content, "spatiul_stat_2_sublabel", "") or ""
    s3_sub = getattr(content, "spatiul_stat_3_sublabel", "") or ""

    fi_raw = (getattr(content, "filosofie_paragraph", "") or "").strip()
    if not fi_raw:
        fi_raw = "\n\n".join(
            [
                (getattr(content, "filosofie_intro", "") or "").strip(),
                (getattr(content, "filosofie_paragraph_1", "") or "").strip(),
                (getattr(content, "filosofie_paragraph_2", "") or "").strip(),
            ]
        ).strip()

    parts = [p.strip() for p in re.split(r"\n\s*\n+", fi_raw) if p.strip()]
    fi_intro = parts[0] if len(parts) > 0 else ""
    fi_p1 = parts[1] if len(parts) > 1 else ""
    fi_p2 = "\n\n".join(parts[2:]).strip() if len(parts) > 2 else ""

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
                "seo_blurb": content.spatiul_seo_blurb,
                "hidden_keywords": content.spatiul_hidden_keywords,
                "image_1": _img_url(content.spatiul_image_1),
                "quote": content.spatiul_quote,
                "stats": [
                    {"value": content.spatiul_stat_1_value, "label": content.spatiul_stat_1_label, "sublabel": s1_sub},
                    {"value": content.spatiul_stat_2_value, "label": content.spatiul_stat_2_label, "sublabel": s2_sub},
                    {"value": content.spatiul_stat_3_value, "label": content.spatiul_stat_3_label, "sublabel": s3_sub},
                ],
            },
            "filosofie": {
                "label": content.filosofie_label,
                "title_line_1": content.filosofie_title_line_1,
                "title_line_2": content.filosofie_title_line_2,
                "intro": fi_intro,
                "paragraph_1": fi_p1,
                "paragraph_2": fi_p2,
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
    out = []
    hero = _img_url(page.hero_image)
    if hero:
        out.append(hero)

    try:
        for gi in page.gallery_images.all():
            u = _img_url(gi.image)
            if u and u not in out:
                out.append(u)
    except Exception:
        pass

    return out


def _article_videos(page: JurnalArticlePage):
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
                "image": _img_url(p.hero_image),
                "images": images,
                "videos": videos,
                "excerpt": p.excerpt,
                "meta": p.meta,
            }
        )

    return JsonResponse(
        {"index": {"label": index.label, "title": index.title, "subtitle": index.subtitle, "intro": index.intro}, "items": items}
    )


def jurnal_detail(request, slug):
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
                "image": _img_url(page.hero_image),
                "images": images,
                "videos": videos,
                "excerpt": page.excerpt,
                "meta": page.meta,
                "body_html": str(page.body) if page.body else "",
            }
        }
    )


def _get_active_membrie_questions(request):
    settings_obj = MembrieFormContent.for_request(request)

    out = []
    try:
        if settings_obj and settings_obj.questions:
            for blk in settings_obj.questions:
                if blk.block_type != "question":
                    continue
                v = blk.value or {}
                item = {
                    "key": str(v.get("key") or "").strip(),
                    "question_text": str(v.get("question_text") or "").strip(),
                    "suggested_answer": str(v.get("suggested_answer") or "").strip(),
                    "required": bool(v.get("required", True)),
                    "is_active": bool(v.get("is_active", True)),
                    "order": int(v.get("order") or 0),
                }
                if item["key"] and item["question_text"] and item["is_active"]:
                    out.append(item)
    except Exception:
        return []

    out.sort(key=lambda x: (x["order"], x["key"]))
    return out


def membership_questions(request):
    items = _get_active_membrie_questions(request)
    return JsonResponse({"items": items})


def _parse_age_number(child_age: str):
    s = str(child_age or "").strip()
    m = re.search(r"(\d+)", s)
    if not m:
        return None
    try:
        return int(m.group(1))
    except Exception:
        return None


def _get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if xff:
        return xff.split(",")[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None


@csrf_exempt
def membrie_application(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required = ["parent_name", "phone", "email", "child_name", "child_age", "expectation"]
    missing = [k for k in required if not str(data.get(k, "")).strip()]
    if missing:
        return JsonResponse({"error": "Missing required fields.", "fields": missing}, status=400)

    parent_name = data["parent_name"].strip()
    phone = data["phone"].strip()
    email = data["email"].strip()
    child_name = data["child_name"].strip()
    child_age = data["child_age"].strip()
    expectation = data["expectation"].strip()
    source = data.get("source", "").strip() or "website"

    art_relationship = (data.get("art_relationship") or "").strip()

    qa_items = data.get("qa_items") or []
    if not isinstance(qa_items, list):
        qa_items = []

    try:
        validate_email(email)
    except Exception:
        return JsonResponse({"error": "Email invalid."}, status=400)

    if expectation not in ("hobby", "performance"):
        return JsonResponse({"error": "Expectation must be 'hobby' or 'performance'."}, status=400)

    age_num = _parse_age_number(child_age)
    if age_num is None:
        return JsonResponse({"error": "Vârsta copilului este invalidă."}, status=400)
    if age_num < 4:
        return JsonResponse({"error": "Vârsta minimă pentru înscriere este 4 ani."}, status=400)

    expectation_label = "Hobby" if expectation == "hobby" else "Performanță"

    to_email = getattr(settings, "MEMBRIE_APPLICATION_TO_EMAIL", "") or ""
    if not to_email:
        return JsonResponse({"error": "Server is not configured with a destination email."}, status=500)

    if not qa_items:
        dynamic_answers = data.get("dynamic_answers") or {}
        if not isinstance(dynamic_answers, dict):
            dynamic_answers = {}

        qa_items = [
            {"question": "Nume părinte (complet)", "answer": parent_name},
            {"question": "Telefon", "answer": phone},
            {"question": "Email", "answer": email},
            {"question": "Nume copil", "answer": child_name},
            {"question": "Vârsta copilului", "answer": child_age},
        ]

        cms_questions = _get_active_membrie_questions(request)
        for q in cms_questions:
            ans = str(dynamic_answers.get(q["key"], "")).strip()
            if q["required"] and not ans:
                return JsonResponse({"error": f"Lipsește răspunsul pentru: {q['question_text']}"}, status=400)
            if ans:
                qa_items.append({"question": q["question_text"], "answer": ans})

        if art_relationship:
            qa_items.append({"question": "Relația cu arta", "answer": art_relationship})

        qa_items.append({"question": "Așteptări", "answer": expectation_label})

    ip = _get_client_ip(request)
    ua = (request.META.get("HTTP_USER_AGENT") or "").strip()

    app = MembershipApplication.objects.create(
        parent_name=parent_name,
        phone=phone,
        email=email,
        child_name=child_name,
        child_age=child_age,
        expectation=expectation,
        source=source,
        art_relationship=art_relationship,
        qa_json=qa_items,
        ip_address=ip,
        user_agent=ua,
        raw_payload=data,
    )

    for idx, item in enumerate(qa_items):
        q = str(item.get("question", "")).strip()
        a = str(item.get("answer", "")).strip()
        if not q:
            continue
        MembershipQAItem.objects.create(application=app, question=q[:255], answer=a, order=idx)

    subject = f"[Membrie] Aplicație nouă – {parent_name} / {child_name}"

    lines = [
        "A fost trimisă o aplicație nouă (Membrie):",
        "",
        f"Părinte: {parent_name}",
        f"Telefon: {phone}",
        f"Email: {email}",
        "",
        f"Copil: {child_name}",
        f"Vârsta: {child_age}",
        "",
        f"Așteptări: {expectation_label}",
        f"Sursa: {source}",
        f"IP: {ip or ''}",
        "",
        "Întrebări + răspunsuri:",
        "",
    ]
    for item in qa_items:
        q = str(item.get("question", "")).strip()
        a = str(item.get("answer", "")).strip()
        if q:
            lines.append(f"- {q}: {a}")
    message = "\n".join(lines)

    context = {
        "parent_name": parent_name,
        "phone": phone,
        "email": email,
        "child_name": child_name,
        "child_age": child_age,
        "expectation_label": expectation_label,
        "source": source,
        "submitted_at": timezone.localtime().strftime("%d %b %Y, %H:%M"),
        "qa_items": qa_items,
        "application_id": app.id,
        "ip": ip,
        "user_agent": ua,
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
        return JsonResponse({"error": "Failed to send email.", "detail": str(e)}, status=500)

    return JsonResponse({"ok": True, "id": app.id}, status=201)


# ------------------------------------------------------------
# ✅ Newsletter (serious): subscribe + email confirm link
# ------------------------------------------------------------
def _build_absolute_url(request, path: str) -> str:
    """
    Sa fie robust și în dev & prod.
    - Dacă ai setat settings.PUBLIC_BASE_URL (ex: https://ateliere...),
      îl folosim.
    - Altfel folosim request.build_absolute_uri(...)
    """
    base = (getattr(settings, "PUBLIC_BASE_URL", "") or "").rstrip("/")
    if base:
        return f"{base}{path}"
    return request.build_absolute_uri(path)


@csrf_exempt
def newsletter_subscribe(request):
    """
    POST /api/newsletter/subscribe/
    Body: { "email": "test@example.com" }

    Behavior:
    - Create/refresh subscriber (inactive until confirmed)
    - Send confirmation email (with link)
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)

    email = (data.get("email") or "").strip().lower()
    if not email:
        return JsonResponse({"detail": "Email is required."}, status=400)

    try:
        validate_email(email)
    except Exception:
        return JsonResponse({"detail": "Email invalid."}, status=400)

    ip = _get_client_ip(request)
    ua = (request.META.get("HTTP_USER_AGENT") or "").strip()[:255]

    obj, created = NewsletterSubscriber.objects.get_or_create(
        email=email,
        defaults={
            "ip_address": ip,
            "user_agent": ua,
            "source": "website",
            "is_active": False,
        },
    )

    # dacă e deja confirmat -> ok (nu mai trimitem email la fiecare submit)
    if obj.is_active and obj.confirmed_at:
        return JsonResponse(
            {"ok": True, "created": False, "status": "already_confirmed", "message": "Ești deja abonat."},
            status=200,
        )

    # generează token nou (trimitem confirmarea)
    token = secrets.token_urlsafe(32)
    obj.confirm_token = token
    obj.confirm_sent_at = timezone.now()
    # update meta
    if ip:
        obj.ip_address = ip
    if ua:
        obj.user_agent = ua
    obj.save()

    confirm_path = reverse("newsletter-confirm") + f"?token={token}"
    confirm_url = _build_absolute_url(request, confirm_path)

    subject = "Confirmă abonarea la Newsletter — Ateliere la Scânteia"

    text_message = (
        "Bună!\n\n"
        "Mai este un singur pas pentru a confirma abonarea la newsletter.\n"
        "Apasă pe linkul de mai jos:\n\n"
        f"{confirm_url}\n\n"
        "Dacă nu ai cerut această abonare, poți ignora mesajul.\n"
    )

    html_message = f"""
      <div style="font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.6;">
        <h2 style="margin:0 0 12px 0;">Confirmă abonarea</h2>
        <p style="margin:0 0 14px 0;">
          Mai este un singur pas pentru a confirma abonarea la newsletter.
        </p>
        <p style="margin:0 0 18px 0;">
          <a href="{confirm_url}" style="display:inline-block; padding:10px 16px; border-radius:999px; background:#111; color:#fff; text-decoration:none;">
            Confirmă abonarea
          </a>
        </p>
        <p style="margin:0; font-size:12px; color:#666;">
          Dacă nu ai cerut această abonare, poți ignora mesajul.
        </p>
      </div>
    """

    # dacă email-urile nu sunt configurate, asta va ridica eroare (și e bine să vezi în dev)
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[email],
            fail_silently=False,
            html_message=html_message,
        )
    except Exception as e:
        return JsonResponse(
            {"detail": "Failed to send confirmation email.", "error": str(e)},
            status=500,
        )

    return JsonResponse(
        {
            "ok": True,
            "created": created,
            "status": "pending_confirm",
            "message": "Verifică emailul și confirmă abonarea.",
        },
        status=201 if created else 200,
    )


def newsletter_confirm(request):
    """
    GET /api/newsletter/confirm/?token=...
    Activează abonarea și afișează o pagină HTML frumoasă.
    """
    from django.shortcuts import render

    token = (request.GET.get("token") or "").strip()
    if not token:
        return render(
            request,
            "newsletter/confirm_result.html",
            {"ok": False, "title": "Token lipsă", "message": "Link-ul nu conține un token valid."},
            status=400,
        )

    obj = NewsletterSubscriber.objects.filter(confirm_token=token).first()
    if not obj:
        return render(
            request,
            "newsletter/confirm_result.html",
            {"ok": False, "title": "Link invalid", "message": "Link invalid sau deja folosit."},
            status=400,
        )

    max_hours = int(getattr(settings, "NEWSLETTER_CONFIRM_TTL_HOURS", 72))
    if obj.confirm_sent_at:
        delta = timezone.now() - obj.confirm_sent_at
        if delta.total_seconds() > max_hours * 3600:
            return render(
                request,
                "newsletter/confirm_result.html",
                {
                    "ok": False,
                    "title": "Link expirat",
                    "message": "Link-ul a expirat. Reîncearcă abonarea din footer, apoi confirmă din nou.",
                },
                status=400,
            )

    obj.is_active = True
    obj.confirmed_at = timezone.now()
    obj.confirm_token = ""
    obj.save()

    return render(
        request,
        "newsletter/confirm_result.html",
        {
            "ok": True,
            "title": "Abonarea a fost confirmată",
            "message": "Mulțumim! De acum primești update-uri despre sesiuni și locuri disponibile.",
            "cta_url": "/",
            "cta_label": "Înapoi pe site",
        },
        status=200,
    )
