# core/management/commands/import_jurnal_seed.py
from __future__ import annotations

import os
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from wagtail.models import Page
from wagtail.images import get_image_model

from core.models import JurnalIndexPage, JurnalArticlePage


SEED = [
    {
        "slug": "greseala-cel-mai-bun-profesor",
        "category": "FILOSOFIE",
        "title": "De ce „greșeala” este cel mai bun profesor de artă",
        "image_filename": "jurnal1.jpeg",
        "excerpt": "În atelier, greșeala nu e eșec. E material brut pentru observație, curaj și limbaj vizual.",
        "body_paragraphs": [
            "În educația estetică, greșeala e un instrument – nu o rușine. Când copilul înțelege că o linie „ratată” poate deveni o idee nouă, se naște libertatea de a explora.",
            "În loc de corecturi rapide, lucrăm cu întrebări: Ce se întâmplă dacă? Cum se schimbă compoziția dacă mutăm centrul de greutate? Ce poveste spune pata?",
            "Așa apar ritmul, intenția și disciplina blândă: nu pentru note, ci pentru un limbaj personal care crește în timp.",
        ],
        "meta": "6 min · Atelier",
    },
    {
        "slug": "materialele-conteaza",
        "category": "MATERIALE",
        "title": "Materialele contează: de la tempera de supermarket la pigment profesionist",
        "image_filename": "jurnal2.jpeg",
        "excerpt": "Diferența dintre „merge” și „se simte bine” vine adesea din material: densitate, granulație, lumină.",
        "body_paragraphs": [
            "Materialele nu sunt un moft. Sunt un profesor tăcut. Un pigment bun îți arată imediat ce înseamnă transparență, stratificare și răbdare.",
            "La început, scopul nu e luxul, ci consistența: să poți repeta un gest și să înveți din el. Când materialul e imprevizibil, copilul învață frustrare – nu artă.",
            "Alegem instrumente care răsplătesc atenția: hârtie cu textură, pensule care țin apă, culori care nu „mor” pe foaie.",
        ],
        "meta": "8 min · Practică",
    },
    {
        "slug": "spatiul-ca-mentor",
        "category": "SPAȚIU",
        "title": "Spațiul ca mentor: cum arhitectura influențează creativitatea",
        "image_filename": "jurnal3.jpeg",
        "excerpt": "Lumina, liniștea și proporțiile nu sunt decor. Sunt condiții care modelează atenția.",
        "body_paragraphs": [
            "Un spațiu coerent invită la lucru profund. Lumina bună reduce graba. Ordinea reduce anxietatea. Aerul și distanțele dau curaj.",
            "Când copilul intră într-un loc care respectă actul artistic, își schimbă postura: devine mai atent, mai prezent.",
            "Într-un atelier, arhitectura devine un cadru moral: aici avem voie să încercăm, să repetăm și să tăcem.",
        ],
        "meta": "7 min · Observație",
    },
]


def paragraphs_to_richtext(paragraphs: list[str]) -> str:
    # RichTextField accepts HTML; keep it simple + safe.
    safe = []
    for p in paragraphs:
        p = (p or "").strip()
        if not p:
            continue
        # Minimal escaping (quotes are okay in HTML text content)
        p = p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        safe.append(f"<p>{p}</p>")
    return "\n".join(safe)


def get_home_page() -> Page:
    # Usually the first child of the root is the "Home" page.
    root = Page.get_first_root_node()
    home = root.get_children().live().first()
    return home or root


def get_or_create_index(parent: Page, title: str = "Jurnal") -> JurnalIndexPage:
    existing = JurnalIndexPage.objects.child_of(parent).first()
    if existing:
        return existing

    index = JurnalIndexPage(
        title=title,
        slug=slugify(title) or "jurnal",
        label="( ARHIVA SCÂNTEIA )",
        subtitle="— note despre artă",
        intro="- Gânduri scurte, blânde și practice despre procesul creativ al copiilor: materiale, spațiu, curaj și bucuria de a încerca.",
    )
    parent.add_child(instance=index)
    index.save_revision().publish()
    return index


def get_or_create_image(image_dir: str | None, filename: str, title: str):
    if not image_dir:
        return None

    path = Path(image_dir) / filename
    if not path.exists():
        return None

    Image = get_image_model()

    # Reuse if already imported
    existing = Image.objects.filter(title=title).first()
    if existing:
        return existing

    with open(path, "rb") as f:
        image = Image(title=title, file=File(f, name=filename))
        image.save()
        return image


def get_unique_slug(parent: Page, desired_slug: str) -> str:
    # Ensure slug is unique under the same parent
    slug = desired_slug
    i = 2
    while parent.get_children().filter(slug=slug).exists():
        slug = f"{desired_slug}-{i}"
        i += 1
    return slug


class Command(BaseCommand):
    help = "Import seed Jurnal articles into Wagtail (creates index + 3 articles, optionally imports images)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--image-dir",
            dest="image_dir",
            default=None,
            help="Path to folder containing jurnal1.jpeg/jurnal2.jpeg/jurnal3.jpeg (e.g. ../frontend/src/assets)",
        )
        parser.add_argument(
            "--parent-page-id",
            dest="parent_page_id",
            default=None,
            help="Optional Wagtail page ID to use as parent for Jurnal index (defaults to Home).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without writing changes.",
        )

    def handle(self, *args, **options):
        image_dir = options.get("image_dir")
        parent_page_id = options.get("parent_page_id")
        dry_run = bool(options.get("dry_run"))

        if image_dir:
            image_dir = os.path.abspath(image_dir)

        if parent_page_id:
            parent = Page.objects.get(id=int(parent_page_id)).specific
        else:
            parent = get_home_page().specific

        self.stdout.write(self.style.MIGRATE_HEADING(f"Parent page: {parent.title} (id={parent.id})"))

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN enabled — no changes will be saved."))

        # Index
        index = JurnalIndexPage.objects.child_of(parent).first()
        if not index:
            self.stdout.write(self.style.NOTICE("Jurnal index not found. Will create one."))
            if not dry_run:
                index = get_or_create_index(parent)
        else:
            self.stdout.write(self.style.SUCCESS(f"Found Jurnal index: {index.title} (id={index.id})"))

        if not index and dry_run:
            # Simulate index instance for slug checks
            index = None

        created = 0
        skipped = 0

        for s in SEED:
            slug = s["slug"]
            title = s["title"]

            # If we can't determine index in dry-run, just report
            if dry_run and not index:
                self.stdout.write(f"- Would create article: {title} (slug={slug})")
                continue

            # Exists?
            exists = JurnalArticlePage.objects.child_of(index).filter(slug=slug).first()
            if exists:
                self.stdout.write(self.style.WARNING(f"Skip (exists): {title} (slug={slug})"))
                skipped += 1
                continue

            article_slug = get_unique_slug(index, slug)
            hero_image = get_or_create_image(image_dir, s["image_filename"], title=title) if image_dir else None

            body_html = paragraphs_to_richtext(s["body_paragraphs"])

            self.stdout.write(self.style.NOTICE(f"Create: {title} (slug={article_slug})"))

            if not dry_run:
                page = JurnalArticlePage(
                    title=title,
                    slug=article_slug,
                    category=s.get("category", "") or "",
                    meta=s.get("meta", "") or "",
                    excerpt=s.get("excerpt", "") or "",
                    body=body_html,
                    hero_image=hero_image,
                )
                index.add_child(instance=page)
                page.save_revision().publish()
                created += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Done. Created: {created}, Skipped: {skipped}"))
        if image_dir:
            self.stdout.write(self.style.NOTICE(f"Images source dir: {image_dir}"))
