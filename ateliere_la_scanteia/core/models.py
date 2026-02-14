# models.py
from django.db import models

from modelcluster.fields import ParentalKey
from wagtail import blocks
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.admin.panels import (
    FieldPanel,
    MultiFieldPanel,
    InlinePanel,
)
from wagtail.fields import RichTextField, StreamField
from wagtail.models import Page, Orderable


@register_setting
class MainPageContent(BaseSiteSetting):
    """Global editable content for the main page (used in headless React frontend)."""

    # =========================
    # HERO SECTION
    # =========================
    hero_kicker = models.CharField(
        max_length=255,
        blank=True,
        default="CASA PRESEI LIBERE · BUCUREȘTI",
        help_text="Small line above the main title (e.g. CASA PRESEI LIBERE · BUCUREȘTI)",
    )
    hero_title = models.CharField(max_length=255, blank=True, default="Arta cere spațiu.\nȘi istorie.")
    hero_subtitle = models.TextField(
        blank=True,
        default=(
            "O enclavă de creație vizuală, unde copiii gândesc liber,\n"
            "iar spațiul devine mentor."
        ),
    )

    hero_bg_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    # =========================
    # SPAȚIUL SECTION
    # =========================
    spatiul_label = models.CharField(max_length=255, blank=True, default="( SPAȚIUL )")
    spatiul_title = models.CharField(max_length=255, blank=True, default="Suntem într-un monument.")

    spatiul_paragraph = models.TextField(
        blank=True,
        default=(
            "Tavane înalte, lumină naturală de nord și o atmosferă care impune\n"
            "respect pentru actul artistic. Spațiul nu e decor — este mentor."
        ),
    )

    spatiul_seo_blurb = models.TextField(
        blank=True,
        default="",
        help_text="Text scurt (1–2 fraze) pentru context SEO/geo. Recomandat să NU repete paragraful editorial.",
    )

    spatiul_hidden_keywords = models.TextField(
        blank=True,
        default="",
        help_text="Opțional: keywords extra (separate prin virgulă sau pe linii). Poate fi afișat invizibil (sr-only) în frontend.",
    )

    spatiul_image_1 = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    spatiul_quote = models.TextField(
        blank=True,
        default=(
            "„Numărul strict limitat de locuri asigură că mentorul este un "
            "partener de dialog pentru fiecare copil, nu un supraveghetor.”"
        ),
    )
    spatiul_stat_1_value = models.CharField(max_length=32, blank=True, default="1956")
    spatiul_stat_1_label = models.CharField(max_length=64, blank=True, default="MARMURĂ")
    spatiul_stat_2_value = models.CharField(max_length=32, blank=True, default="4m")
    spatiul_stat_2_label = models.CharField(max_length=64, blank=True, default="LUMINĂ NORD")
    spatiul_stat_3_value = models.CharField(max_length=32, blank=True, default="∞")
    spatiul_stat_3_label = models.CharField(max_length=64, blank=True, default="LINIȘTE")

    # =========================
    # FILOSOFIA SECTION
    # =========================
    filosofie_label = models.CharField(max_length=255, blank=True, default="( FILOSOFIA NOASTRĂ )")
    filosofie_title_line_1 = models.CharField(max_length=255, blank=True, default="Sanctuar Privat.")
    filosofie_title_line_2 = models.CharField(max_length=255, blank=True, default="Libertate Radicală.")
    filosofie_intro = models.TextField(
        blank=True,
        default=(
            "Departe de agitația comercială, Ateliere la Scânteia oferă un\n"
            "spațiu unde timpul curge altfel."
        ),
    )
    filosofie_paragraph_1 = models.TextField(
        blank=True,
        default=(
            "Într-un cerc restrâns și securizat, copiii scapă de presiunea\n"
            "notelor și a performanței standardizate. Aici găsesc libertatea\n"
            "radicală de a crea fără frică."
        ),
    )
    filosofie_paragraph_2 = models.TextField(
        blank=True,
        default=(
            "Oferim materiale profesioniste și spațiu vital imens pentru ca\n"
            "cei mici să-și testeze limitele creativității într-un mediu sigur."
        ),
    )
    filosofie_cta_text = models.CharField(max_length=255, blank=True, default="SOLICITĂ O INVITAȚIE")
    filosofie_image_2 = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    filosofie_quote = models.TextField(
        blank=True,
        default=(
            "„Numărul strict limitat de locuri asigură că mentorul este un "
            "partener de dialog pentru fiecare copil, nu un supraveghetor.”"
        ),
    )

    # =========================
    # TESTIMONIALE SECTION
    # =========================
    testimoniale_title = models.CharField(max_length=255, blank=True, default="Vocile Comunității")

    testimonial_1_quote = models.TextField(
        blank=True,
        default=(
            "Într-o lume a dopaminei instantanee, acesta este singurul loc unde fiul meu are răbdarea să lucreze două ore la o singură linie de cărbune."
        ),
    )
    testimonial_1_name = models.CharField(max_length=120, blank=True, default="Ana M.")
    testimonial_1_role = models.CharField(max_length=255, blank=True, default="Partner @ Arhitectură & Design")

    testimonial_2_quote = models.TextField(
        blank=True,
        default=(
            "Scara monumentală a Casei Presei îi obligă pe copii să gândească mare. Nu există «drăgălășenii» aici. Există studiu, proporție și seriozitate."
        ),
    )
    testimonial_2_name = models.CharField(max_length=120, blank=True, default="Alexandru S.")
    testimonial_2_role = models.CharField(max_length=255, blank=True, default="Tech Entrepreneur & Collector")

    testimonial_3_quote = models.TextField(
        blank=True,
        default=(
            "Am căutat mult timp un loc care să nu fie un «parking de copii». Aici am găsit o comunitate de familii care împărtășesc aceleași valori."
        ),
    )
    testimonial_3_name = models.CharField(max_length=120, blank=True, default="Ioana D.")
    testimonial_3_role = models.CharField(max_length=255, blank=True, default="Medic & Membru Fondator")

    testimonial_4_quote = models.TextField(
        blank=True,
        default=(
            "Copiii mei au descoperit că arta nu este despre talent înnăscut, ci despre disciplină și observație atentă. Evoluția lor este incredibilă."
        ),
    )
    testimonial_4_name = models.CharField(max_length=120, blank=True, default="Maria T.")
    testimonial_4_role = models.CharField(max_length=255, blank=True, default="Avocat & Colecționar")

    testimonial_5_quote = models.TextField(
        blank=True,
        default=(
            "Spațiul în sine este o lecție de estetică. Fiecare dată când intrăm, copiii simt că fac parte din ceva care transcende simplul «curs de desen»."
        ),
    )
    testimonial_5_name = models.CharField(max_length=120, blank=True, default="Cristian P.")
    testimonial_5_role = models.CharField(max_length=255, blank=True, default="Arhitect & Fondator Studio")

    # =========================
    # MANIFEST SECTION
    # =========================
    manifest_label = models.CharField(
        max_length=255,
        blank=True,
        default="( PROCESUL DE SELECȚIE )",
        help_text="Small label above the main manifest title (e.g. ( PROCESUL DE SELECȚIE ))",
    )
    manifest_title = models.CharField(
        max_length=255,
        blank=True,
        default="Accesul este limitat la\n12 membri pe sezon.",
    )
    manifest_text = models.TextField(
        blank=True,
        default=(
            "Căutăm familii care înțeleg că educația estetică este o investiție pe viață.\n"
            "Nu vindem cursuri. Construim fundații artistice."
        ),
    )

    manifest_card_1_title = models.CharField(max_length=255, blank=True, default="Selecție atentă")
    manifest_card_1_text = models.TextField(
        blank=True,
        default="Discutăm cu părinții și înțelegem contextul copilului înainte de a confirma un loc.",
    )

    manifest_card_2_title = models.CharField(max_length=255, blank=True, default="Comunitate restrânsă")
    manifest_card_2_text = models.TextField(
        blank=True,
        default="Menținem un grup mic pentru dialog real cu mentorul și progres vizibil.",
    )

    manifest_card_3_title = models.CharField(max_length=255, blank=True, default="Invitație, nu înscriere")
    manifest_card_3_text = models.TextField(
        blank=True,
        default="Confirmarea se face prin invitație, în funcție de potrivirea cu valorile atelierelor.",
    )

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("hero_kicker"),
                FieldPanel("hero_title"),
                FieldPanel("hero_subtitle"),
                FieldPanel("hero_bg_image"),
            ],
            heading="Hero Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("spatiul_label"),
                FieldPanel("spatiul_title"),
                FieldPanel("spatiul_paragraph"),
                FieldPanel("spatiul_seo_blurb"),
                FieldPanel("spatiul_hidden_keywords"),
                FieldPanel("spatiul_image_1"),
                FieldPanel("spatiul_quote"),
                FieldPanel("spatiul_stat_1_value"),
                FieldPanel("spatiul_stat_1_label"),
                FieldPanel("spatiul_stat_2_value"),
                FieldPanel("spatiul_stat_2_label"),
                FieldPanel("spatiul_stat_3_value"),
                FieldPanel("spatiul_stat_3_label"),
            ],
            heading="Spațiul Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("filosofie_label"),
                FieldPanel("filosofie_title_line_1"),
                FieldPanel("filosofie_title_line_2"),
                FieldPanel("filosofie_intro"),
                FieldPanel("filosofie_paragraph_1"),
                FieldPanel("filosofie_paragraph_2"),
                FieldPanel("filosofie_cta_text"),
                FieldPanel("filosofie_image_2"),
                FieldPanel("filosofie_quote"),
            ],
            heading="Filosofia Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("testimoniale_title"),
                MultiFieldPanel(
                    [FieldPanel("testimonial_1_quote"), FieldPanel("testimonial_1_name"), FieldPanel("testimonial_1_role")],
                    heading="Testimonial 1",
                ),
                MultiFieldPanel(
                    [FieldPanel("testimonial_2_quote"), FieldPanel("testimonial_2_name"), FieldPanel("testimonial_2_role")],
                    heading="Testimonial 2",
                ),
                MultiFieldPanel(
                    [FieldPanel("testimonial_3_quote"), FieldPanel("testimonial_3_name"), FieldPanel("testimonial_3_role")],
                    heading="Testimonial 3",
                ),
                MultiFieldPanel(
                    [FieldPanel("testimonial_4_quote"), FieldPanel("testimonial_4_name"), FieldPanel("testimonial_4_role")],
                    heading="Testimonial 4",
                ),
                MultiFieldPanel(
                    [FieldPanel("testimonial_5_quote"), FieldPanel("testimonial_5_name"), FieldPanel("testimonial_5_role")],
                    heading="Testimonial 5",
                ),
            ],
            heading="Testimoniale Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("manifest_label"),
                FieldPanel("manifest_title"),
                FieldPanel("manifest_text"),
                MultiFieldPanel(
                    [FieldPanel("manifest_card_1_title"), FieldPanel("manifest_card_1_text")],
                    heading="Card 1",
                ),
                MultiFieldPanel(
                    [FieldPanel("manifest_card_2_title"), FieldPanel("manifest_card_2_text")],
                    heading="Card 2",
                ),
                MultiFieldPanel(
                    [FieldPanel("manifest_card_3_title"), FieldPanel("manifest_card_3_text")],
                    heading="Card 3",
                ),
            ],
            heading="Manifest Section",
        ),
    ]


# =========================
# JURNAL PAGES (Wagtail)
# =========================

class JurnalIndexPage(Page):
    """
    Container page for Jurnal articles.
    Damian will add articles as children of this page.
    """
    label = models.CharField(max_length=255, blank=True, default="( ARHIVA SCÂNTEIA )")
    subtitle = models.CharField(max_length=255, blank=True, default="— note despre artă")
    intro = models.TextField(
        blank=True,
        default="- Gânduri scurte, blânde și practice despre procesul creativ al copiilor: materiale, spațiu, curaj și bucuria de a încerca.",
    )

    content_panels = Page.content_panels + [
        FieldPanel("label"),
        FieldPanel("subtitle"),
        FieldPanel("intro"),
    ]

    subpage_types = ["core.JurnalArticlePage"]


class JurnalArticlePage(Page):
    """
    Individual jurnal article page.

    NEW:
      - gallery_images (multiple images)
      - videos (multiple URL embeds)
    """
    category = models.CharField(max_length=60, blank=True, default="FILOSOFIE")
    excerpt = models.TextField(blank=True, default="")

    # Hero stays the primary "image"
    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    meta = models.CharField(max_length=80, blank=True, default="6 min · Atelier")
    body = RichTextField(blank=True, features=["h2", "h3", "bold", "italic", "ol", "ul", "link"])

    # ✅ Multiple video embed links (YouTube/Vimeo/MP4 etc.)
    videos = StreamField(
        [
            ("video", blocks.URLBlock(required=True, help_text="YouTube/Vimeo/mp4 link")),
        ],
        blank=True,
        use_json_field=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("category"),
        FieldPanel("meta"),
        FieldPanel("excerpt"),
        FieldPanel("hero_image"),

        # ✅ Gallery images
        MultiFieldPanel(
            [
                InlinePanel("gallery_images", label="Imagini galerie"),
            ],
            heading="Galerie imagini (pentru slider / carduri)",
        ),

        # ✅ Videos
        MultiFieldPanel(
            [
                FieldPanel("videos"),
            ],
            heading="Video-uri (embed links)",
        ),

        FieldPanel("body"),
    ]

    parent_page_types = ["core.JurnalIndexPage"]


class JurnalArticleGalleryImage(Orderable):
    """
    Sortable gallery images for an article page.
    """
    page = ParentalKey(
        "core.JurnalArticlePage",
        related_name="gallery_images",
        on_delete=models.CASCADE,
    )

    image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=False,
        on_delete=models.CASCADE,
        related_name="+",
    )

    caption = models.CharField(max_length=140, blank=True, default="")

    panels = [
        FieldPanel("image"),
        FieldPanel("caption"),
    ]
