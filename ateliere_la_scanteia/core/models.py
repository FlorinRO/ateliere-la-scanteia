# core/models.py
from django.db import models
from django.utils import timezone
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from modelcluster.fields import ParentalKey
from wagtail import blocks
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.admin.panels import (
    FieldPanel,
    MultiFieldPanel,
    InlinePanel,
)
from wagtail.fields import RichTextField, StreamField
from wagtail.models import Page, Orderable, Site


# ======================================================================
# ✅ DEFAULTS (new copy from Damian) + legacy defaults for safe upgrading
# ======================================================================

# --- NEW (Damian) ---
NEW_SPATIUL_TITLE = "Spațiul"
NEW_SPATIUL_PARAGRAPH = (
    "Căutați un curs de pictură pentru copii în București unde atenția să nu se împartă la 15?\n"
    "Atelierele noastre de artă se desfășoară într-un spațiu diferit, ancorat în istoria orașului: clădirea\n"
    "monumentală a Casei Presei Libere (fosta Casa Scânteii), în nordul Capitalei. Am înlocuit\n"
    "aglomerația sălilor de clasă convenționale cu un mediu sigur, aerisit și lipsit de factori de stres,\n"
    "conceput pentru a stimula creativitatea.\n"
    "Unde și cum învață copilul tău? Locul este un instrument educațional în sine. Am transformat\n"
    "un studio generos într-un spațiu de concentrare, dedicat exclusiv micro-grupelor de doar 4\n"
    "copii. Cu ferestre uriașe care inundă încăperea cu lumină naturală și o acustică ce elimină\n"
    "zgomotul de fond al orașului, mediul de lucru îi oferă copilului libertate de mișcare și liniștea\n"
    "necesară pentru a explora arta.\n"
    "Copiii nu poartă nostalgia trecutului; ei sunt o formă pură de prezent. Pentru ei, acest\n"
    "monument istoric nu este o relicvă, ci o pânză albă. Iar aici, educația vizuală devine un act de\n"
    "încredere: încrederea că, într-un spațiu care a servit odată conformității, se pot naște acum cele\n"
    "mai libere idei.\n"
)
NEW_TEXTBOX_QUOTE = (
    "Numărul strict limitat de locuri asigură că mentorul este un partener de dialog pentru fiecare copil, nu un supraveghetor."
)

NEW_SP_STAT_1_VALUE = "4"
NEW_SP_STAT_1_LABEL = "Copii într-o grupă."
NEW_SP_STAT_1_SUB = "Nu 12, nu 15."

NEW_SP_STAT_2_VALUE = "100%"
NEW_SP_STAT_2_LABEL = "Lumină naturală"
NEW_SP_STAT_2_SUB = "Percepția corectă a culorilor."

NEW_SP_STAT_3_VALUE = "0"
NEW_SP_STAT_3_LABEL = "Zgomot. Presiune."
NEW_SP_STAT_3_SUB = "Fără competiție inutilă."

NEW_FI_TITLE_1 = "Sanctuar privat."
NEW_FI_TITLE_2 = "Libertate radicală."
NEW_FI_INTRO = (
    "Răspundem direct celei mai stringente nevoi a părinților: atenția individuală.\n"
    "Spre deosebire de aglomerația din sistemul clasic, un mentor coordonează o grupă mică de maximum 4\n"
    "copii.\n"
    "Acest raport asimetric garantează o educație personalizată, însă și un nivel de libertate\n"
    "esențial pentru cursuri de pictură și artă în București. Fiecare copil este ascultat, înțeles și\n"
    "îndrumat."
)
NEW_FI_P1 = (
    "Într-un cerc restrâns și securizat, copiii scapă de presiunea notelor și a performanței\n"
    "standardizate. Aici găsesc libertatea radicală de a crea fără frică."
)
NEW_FI_P2 = (
    "Lucrăm cu materiale profesionale și spațiu vital imens pentru ca cei mici să își testeze limitele\n"
    "creativității într-un mediu sigur."
)

NEW_FI_PARAGRAPH = NEW_FI_INTRO + "\n\n" + NEW_FI_P1 + "\n\n" + NEW_FI_P2

NEW_MANIFEST_CARD_1_TITLE = "Lumina naturală"
NEW_MANIFEST_CARD_1_TEXT = (
    "Arta nu se face sub neone și părinții caută un mediu de învățare sănătos, departe de lumina\n"
    "artificială a ecranelor. Spațiul nostru din Casa Presei oferă o iluminare naturală ideală, vitală\n"
    "pentru percepția corectă a culorilor în artă. Acest aspect tehnic previne oboseala oculară și\n"
    "susține concentrarea pe termen lung pe parcursul activităților educative de weekend."
)

NEW_MANIFEST_CARD_2_TITLE = "Mentoratul"
NEW_MANIFEST_CARD_2_TEXT = (
    "La Atelierele Scânteia, direcția educațională este asigurată de Andreea Apăvăloaei, absolventă\n"
    "cu nota 10 a Universitatea Nationala de Arte Bucuresti, cu un portofoliu impresionant consolidat\n"
    "pe parcursul a trei decenii, orizontul ei artistic depășește cu mult șevaletul clasic. Abordând arta\n"
    "ca pe o „meditație activă”, Andreea traduce pentru cursanții noștri o experiență multidisciplinară\n"
    "complexă și formare pedagogică acreditată (Certificare pedagogică DPPD)."
)

NEW_MANIFEST_CARD_3_TITLE = "Spațiu să creeze.\nLiniște să se concentreze."
NEW_MANIFEST_CARD_3_TEXT = (
    "Fără zgomot de fond, fără competiție inutilă pentru validarea profesorului. Acest volum aerian,\n"
    "specific arhitecturii monumentale, previne suprastimularea senzorială unde copiii au libertatea\n"
    "de a se mișca"
)

# --- OLD (previous defaults)
OLD_SPATIUL_TITLE = "Suntem într-un monument."
OLD_SPATIUL_PARAGRAPH = (
    "Tavane înalte, lumină naturală de nord și o atmosferă care impune\n"
    "respect pentru actul artistic. Spațiul nu e decor — este mentor."
)
OLD_QUOTE = (
    "„Numărul strict limitat de locuri asigură că mentorul este un "
    "partener de dialog pentru fiecare copil, nu un supraveghetor.”"
)
OLD_SP_STAT_1_VALUE = "1956"
OLD_SP_STAT_1_LABEL = "MARMURĂ"
OLD_SP_STAT_2_VALUE = "4m"
OLD_SP_STAT_2_LABEL = "LUMINĂ NORD"
OLD_SP_STAT_3_VALUE = "∞"
OLD_SP_STAT_3_LABEL = "LINIȘTE"

OLD_FI_TITLE_1 = "Sanctuar Privat."
OLD_FI_TITLE_2 = "Libertate Radicală."
OLD_FI_INTRO = (
    "Departe de agitația comercială, Ateliere la Scânteia oferă un\n"
    "spațiu unde timpul curge altfel."
)
OLD_FI_P1 = (
    "Într-un cerc restrâns și securizat, copiii scapă de presiunea\n"
    "notelor și a performanței standardizate. Aici găsesc libertatea\n"
    "radicală de a crea fără frică."
)
OLD_FI_P2 = (
    "Oferim materiale profesioniste și spațiu vital imens pentru ca\n"
    "cei mici să-și testeze limitele creativității într-un mediu sigur."
)

OLD_MANIFEST_CARD_1_TITLE = "Selecție atentă"
OLD_MANIFEST_CARD_1_TEXT = (
    "Discutăm cu părinții și înțelegem contextul copilului înainte de a confirma un loc."
)
OLD_MANIFEST_CARD_2_TITLE = "Comunitate restrânsă"
OLD_MANIFEST_CARD_2_TEXT = (
    "Menținem un grup mic pentru dialog real cu mentorul și progres vizibil."
)
OLD_MANIFEST_CARD_3_TITLE = "Invitație, nu înscriere"
OLD_MANIFEST_CARD_3_TEXT = (
    "Confirmarea se face prin invitație, în funcție de potrivirea cu valorile atelierelor."
)


@register_setting
class MainPageContent(BaseSiteSetting):
    """Global editable content for the main page (used in headless React frontend)."""

    hero_kicker = models.CharField(
        max_length=255,
        blank=True,
        default="CASA PRESEI LIBERE · BUCUREȘTI",
        help_text="Small line above the main title (e.g. CASA PRESEI LIBERE · BUCUREȘTI)",
    )
    hero_title = models.CharField(
        max_length=255, blank=True, default="Arta cere spațiu.\nȘi istorie."
    )
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

    spatiul_label = models.CharField(max_length=255, blank=True, default="( SPAȚIUL )")
    spatiul_title = models.CharField(
        max_length=255, blank=True, default=NEW_SPATIUL_TITLE
    )

    spatiul_paragraph = models.TextField(
        blank=True,
        default=NEW_SPATIUL_PARAGRAPH,
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
        default=NEW_TEXTBOX_QUOTE,
        help_text="Textul din caseta peste imagine.",
    )

    spatiul_stat_1_value = models.CharField(
        max_length=32, blank=True, default=NEW_SP_STAT_1_VALUE
    )
    spatiul_stat_1_label = models.CharField(
        max_length=64, blank=True, default=NEW_SP_STAT_1_LABEL
    )
    spatiul_stat_1_sublabel = models.CharField(
        max_length=80, blank=True, default=NEW_SP_STAT_1_SUB
    )

    spatiul_stat_2_value = models.CharField(
        max_length=32, blank=True, default=NEW_SP_STAT_2_VALUE
    )
    spatiul_stat_2_label = models.CharField(
        max_length=64, blank=True, default=NEW_SP_STAT_2_LABEL
    )
    spatiul_stat_2_sublabel = models.CharField(
        max_length=80, blank=True, default=NEW_SP_STAT_2_SUB
    )

    spatiul_stat_3_value = models.CharField(
        max_length=32, blank=True, default=NEW_SP_STAT_3_VALUE
    )
    spatiul_stat_3_label = models.CharField(
        max_length=64, blank=True, default=NEW_SP_STAT_3_LABEL
    )
    spatiul_stat_3_sublabel = models.CharField(
        max_length=80, blank=True, default=NEW_SP_STAT_3_SUB
    )

    filosofie_label = models.CharField(
        max_length=255, blank=True, default="( FILOSOFIA NOASTRĂ )"
    )
    filosofie_title_line_1 = models.CharField(
        max_length=255, blank=True, default=NEW_FI_TITLE_1
    )
    filosofie_title_line_2 = models.CharField(
        max_length=255, blank=True, default=NEW_FI_TITLE_2
    )

    filosofie_paragraph = models.TextField(
        blank=True,
        default=NEW_FI_PARAGRAPH,
        help_text="Un singur câmp pentru tot textul. Recomandat: separă blocurile cu o linie goală (Enter de 2 ori).",
    )

    filosofie_intro = models.TextField(blank=True, default="")
    filosofie_paragraph_1 = models.TextField(blank=True, default="")
    filosofie_paragraph_2 = models.TextField(blank=True, default="")

    filosofie_cta_text = models.CharField(
        max_length=255, blank=True, default="SOLICITĂ O INVITAȚIE"
    )
    filosofie_image_2 = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    filosofie_quote = models.TextField(
        blank=True,
        default=NEW_TEXTBOX_QUOTE,
        help_text="Textul din caseta peste imagine (secțiunea Filosofie).",
    )

    testimoniale_title = models.CharField(
        max_length=255, blank=True, default="Vocile Comunității"
    )

    testimonial_1_quote = models.TextField(
        blank=True,
        default=(
            "Într-o lume a dopaminei instantanee, acesta este singurul loc unde fiul meu are răbdarea să lucreze două ore la o singură linie de cărbune."
        ),
    )
    testimonial_1_name = models.CharField(
        max_length=120, blank=True, default="Ana M."
    )
    testimonial_1_role = models.CharField(
        max_length=255, blank=True, default="Partner @ Arhitectură & Design"
    )

    testimonial_2_quote = models.TextField(
        blank=True,
        default=(
            "Scara monumentală a Casei Presei îi obligă pe copii să gândească mare. Nu există «drăgălășenii» aici. Există studiu, proporție și seriozitate."
        ),
    )
    testimonial_2_name = models.CharField(
        max_length=120, blank=True, default="Alexandru S."
    )
    testimonial_2_role = models.CharField(
        max_length=255, blank=True, default="Tech Entrepreneur & Collector"
    )

    testimonial_3_quote = models.TextField(
        blank=True,
        default=(
            "Am căutat mult timp un loc care să nu fie un «parking de copii». Aici am găsit o comunitate de familii care împărtășesc aceleași valori."
        ),
    )
    testimonial_3_name = models.CharField(
        max_length=120, blank=True, default="Ioana D."
    )
    testimonial_3_role = models.CharField(
        max_length=255, blank=True, default="Medic & Membru Fondator"
    )

    testimonial_4_quote = models.TextField(
        blank=True,
        default=(
            "Copiii mei au descoperit că arta nu este despre talent înnăscut, ci despre disciplină și observație atentă. Evoluția lor este incredibilă."
        ),
    )
    testimonial_4_name = models.CharField(
        max_length=120, blank=True, default="Maria T."
    )
    testimonial_4_role = models.CharField(
        max_length=255, blank=True, default="Avocat & Colecționar"
    )

    testimonial_5_quote = models.TextField(
        blank=True,
        default=(
            "Spațiul în sine este o lecție de estetică. Fiecare dată când intrăm, copiii simt că fac parte din ceva care transcende simplul «curs de desen»."
        ),
    )
    testimonial_5_name = models.CharField(
        max_length=120, blank=True, default="Cristian P."
    )
    testimonial_5_role = models.CharField(
        max_length=255, blank=True, default="Arhitect & Fondator Studio"
    )

    manifest_label = models.CharField(
        max_length=255,
        blank=True,
        default="( PROCESUL DE SELECȚIE )",
        help_text="Small line above the main manifest title (e.g. ( PROCESUL DE SELECȚIE ))",
    )
    manifest_title = models.CharField(
        max_length=255,
        blank=True,
        default="Accesul este limitat la\n12 membri pe sezon.",
    )
    manifest_text = models.TextField(
    blank=True,
    default=(
        "Ne adresăm familiilor care înțeleg că educația estetică se formează devreme și rămâne pentru totdeauna.\n"
        "Că sensibilitatea și discernământul vizual se cultivă în timp.\n\n"
        "Nu oferim „activități creative” de weekend. Protejăm un loc în care copilul învață să privească înainte să judece, să aibă răbdare înainte să finalizeze și să aleagă înainte să copieze.\n\n"
        "Și de cele mai multe ori, defapt, noi învățăm de la ei."
    ),
)

    manifest_card_1_title = models.CharField(
        max_length=255, blank=True, default=NEW_MANIFEST_CARD_1_TITLE
    )
    manifest_card_1_text = models.TextField(
        blank=True,
        default=NEW_MANIFEST_CARD_1_TEXT,
    )

    manifest_card_2_title = models.CharField(
        max_length=255, blank=True, default=NEW_MANIFEST_CARD_2_TITLE
    )
    manifest_card_2_text = models.TextField(
        blank=True,
        default=NEW_MANIFEST_CARD_2_TEXT,
    )

    manifest_card_3_title = models.CharField(
        max_length=255, blank=True, default=NEW_MANIFEST_CARD_3_TITLE
    )
    manifest_card_3_text = models.TextField(
        blank=True,
        default=NEW_MANIFEST_CARD_3_TEXT,
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
                FieldPanel("spatiul_stat_1_sublabel"),
                FieldPanel("spatiul_stat_2_value"),
                FieldPanel("spatiul_stat_2_label"),
                FieldPanel("spatiul_stat_2_sublabel"),
                FieldPanel("spatiul_stat_3_value"),
                FieldPanel("spatiul_stat_3_label"),
                FieldPanel("spatiul_stat_3_sublabel"),
            ],
            heading="Spațiul Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("filosofie_label"),
                FieldPanel("filosofie_title_line_1"),
                FieldPanel("filosofie_title_line_2"),
                FieldPanel("filosofie_paragraph"),
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
                    [
                        FieldPanel("testimonial_1_quote"),
                        FieldPanel("testimonial_1_name"),
                        FieldPanel("testimonial_1_role"),
                    ],
                    heading="Testimonial 1",
                ),
                MultiFieldPanel(
                    [
                        FieldPanel("testimonial_2_quote"),
                        FieldPanel("testimonial_2_name"),
                        FieldPanel("testimonial_2_role"),
                    ],
                    heading="Testimonial 2",
                ),
                MultiFieldPanel(
                    [
                        FieldPanel("testimonial_3_quote"),
                        FieldPanel("testimonial_3_name"),
                        FieldPanel("testimonial_3_role"),
                    ],
                    heading="Testimonial 3",
                ),
                MultiFieldPanel(
                    [
                        FieldPanel("testimonial_4_quote"),
                        FieldPanel("testimonial_4_name"),
                        FieldPanel("testimonial_4_role"),
                    ],
                    heading="Testimonial 4",
                ),
                MultiFieldPanel(
                    [
                        FieldPanel("testimonial_5_quote"),
                        FieldPanel("testimonial_5_name"),
                        FieldPanel("testimonial_5_role"),
                    ],
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


# ------------------------------------------------------------
# ✅ Auto-prefill/upgrade CMS values for MainPageContent per Site
# ------------------------------------------------------------
@receiver(post_migrate)
def ensure_default_mainpage_content(sender, **kwargs):
    try:
        if sender and getattr(sender, "name", "") and sender.name != "core":
            return

        FI_INTRO_INTERMEDIATE = (
            "Departe de agitația comercială, Ateliere la Scânteia oferă un\n"
            "spațiu unde timpul curge altfel."
        )
        FI_P1_INTERMEDIATE = (
            "Într-un cerc restrâns și securizat, copiii scapă de presiunea\n"
            "notelor și a performanței standardizate. Aici găsesc libertatea\n"
            "radicală de a crea fără frică."
        )
        FI_P2_INTERMEDIATE = (
            "Oferim materiale profesioniste și spațiu vital imens pentru ca\n"
            "cei mici să-și testeze limitele creativității într-un mediu sigur."
        )

        SP_TITLE_INTERMEDIATE = "Suntem într-un monument."
        SP_PAR_INTERMEDIATE = (
            "Tavane înalte, lumină naturală de nord și o atmosferă care impune\n"
            "respect pentru actul artistic. Spațiul nu e decor — este mentor."
        )
        QUOTE_INTERMEDIATE_1 = (
            "„Numărul strict limitat de locuri asigură că mentorul este un "
            "partener de dialog pentru fiecare copil, nu un supraveghetor.”"
        )
        QUOTE_INTERMEDIATE_2 = (
            "Numărul strict limitat de locuri asigură că mentorul este un partener de dialog pentru fiecare copil, nu un supraveghetor."
        )

        def norm(s: str) -> str:
            return (s or "").replace("\r\n", "\n").strip()

        def should_overwrite(current_value: str, candidates: list[str]) -> bool:
            cur = norm(current_value)
            if cur == "":
                return True
            cand_norm = {norm(c) for c in candidates if c is not None}
            return cur in cand_norm

        for site in Site.objects.all():
            obj = MainPageContent.for_site(site)
            changed = False

            if should_overwrite(obj.spatiul_title, [OLD_SPATIUL_TITLE, SP_TITLE_INTERMEDIATE]):
                obj.spatiul_title = NEW_SPATIUL_TITLE
                changed = True

            if should_overwrite(obj.spatiul_paragraph, [OLD_SPATIUL_PARAGRAPH, SP_PAR_INTERMEDIATE]):
                obj.spatiul_paragraph = NEW_SPATIUL_PARAGRAPH
                changed = True

            if should_overwrite(obj.spatiul_quote, [OLD_QUOTE, QUOTE_INTERMEDIATE_1, QUOTE_INTERMEDIATE_2]):
                obj.spatiul_quote = NEW_TEXTBOX_QUOTE
                changed = True

            if should_overwrite(obj.spatiul_stat_1_value, [OLD_SP_STAT_1_VALUE, "1956"]):
                obj.spatiul_stat_1_value = NEW_SP_STAT_1_VALUE
                changed = True
            if should_overwrite(obj.spatiul_stat_1_label, [OLD_SP_STAT_1_LABEL, "MARMURĂ"]):
                obj.spatiul_stat_1_label = NEW_SP_STAT_1_LABEL
                changed = True
            if should_overwrite(getattr(obj, "spatiul_stat_1_sublabel", ""), [""]):
                obj.spatiul_stat_1_sublabel = NEW_SP_STAT_1_SUB
                changed = True

            if should_overwrite(obj.spatiul_stat_2_value, [OLD_SP_STAT_2_VALUE, "4m"]):
                obj.spatiul_stat_2_value = NEW_SP_STAT_2_VALUE
                changed = True
            if should_overwrite(obj.spatiul_stat_2_label, [OLD_SP_STAT_2_LABEL, "LUMINĂ NORD"]):
                obj.spatiul_stat_2_label = NEW_SP_STAT_2_LABEL
                changed = True
            if should_overwrite(getattr(obj, "spatiul_stat_2_sublabel", ""), [""]):
                obj.spatiul_stat_2_sublabel = NEW_SP_STAT_2_SUB
                changed = True

            if should_overwrite(obj.spatiul_stat_3_value, [OLD_SP_STAT_3_VALUE, "∞"]):
                obj.spatiul_stat_3_value = NEW_SP_STAT_3_VALUE
                changed = True
            if should_overwrite(obj.spatiul_stat_3_label, [OLD_SP_STAT_3_LABEL, "LINIȘTE"]):
                obj.spatiul_stat_3_label = NEW_SP_STAT_3_LABEL
                changed = True
            if should_overwrite(getattr(obj, "spatiul_stat_3_sublabel", ""), [""]):
                obj.spatiul_stat_3_sublabel = NEW_SP_STAT_3_SUB
                changed = True

            if should_overwrite(obj.filosofie_title_line_1, [OLD_FI_TITLE_1, "Sanctuar Privat."]):
                obj.filosofie_title_line_1 = NEW_FI_TITLE_1
                changed = True

            if should_overwrite(obj.filosofie_title_line_2, [OLD_FI_TITLE_2, "Libertate Radicală."]):
                obj.filosofie_title_line_2 = NEW_FI_TITLE_2
                changed = True

            combined_old = (
                norm(obj.filosofie_intro)
                + "\n\n"
                + norm(obj.filosofie_paragraph_1)
                + "\n\n"
                + norm(obj.filosofie_paragraph_2)
            ).strip()

            if should_overwrite(getattr(obj, "filosofie_paragraph", ""), ["", combined_old, OLD_FI_INTRO, FI_INTRO_INTERMEDIATE]):
                if combined_old:
                    obj.filosofie_paragraph = combined_old
                else:
                    obj.filosofie_paragraph = NEW_FI_PARAGRAPH
                changed = True

            if should_overwrite(obj.filosofie_intro, [OLD_FI_INTRO, FI_INTRO_INTERMEDIATE, ""]):
                obj.filosofie_intro = NEW_FI_INTRO
                changed = True
            if should_overwrite(obj.filosofie_paragraph_1, [OLD_FI_P1, FI_P1_INTERMEDIATE, ""]):
                obj.filosofie_paragraph_1 = NEW_FI_P1
                changed = True
            if should_overwrite(obj.filosofie_paragraph_2, [OLD_FI_P2, FI_P2_INTERMEDIATE, ""]):
                obj.filosofie_paragraph_2 = NEW_FI_P2
                changed = True

            if should_overwrite(obj.filosofie_quote, [OLD_QUOTE, QUOTE_INTERMEDIATE_1, QUOTE_INTERMEDIATE_2]):
                obj.filosofie_quote = NEW_TEXTBOX_QUOTE
                changed = True

            if should_overwrite(obj.manifest_card_1_title, [OLD_MANIFEST_CARD_1_TITLE]):
                obj.manifest_card_1_title = NEW_MANIFEST_CARD_1_TITLE
                changed = True
            if should_overwrite(obj.manifest_card_1_text, [OLD_MANIFEST_CARD_1_TEXT]):
                obj.manifest_card_1_text = NEW_MANIFEST_CARD_1_TEXT
                changed = True

            if should_overwrite(obj.manifest_card_2_title, [OLD_MANIFEST_CARD_2_TITLE]):
                obj.manifest_card_2_title = NEW_MANIFEST_CARD_2_TITLE
                changed = True
            if should_overwrite(obj.manifest_card_2_text, [OLD_MANIFEST_CARD_2_TEXT]):
                obj.manifest_card_2_text = NEW_MANIFEST_CARD_2_TEXT
                changed = True

            if should_overwrite(obj.manifest_card_3_title, [OLD_MANIFEST_CARD_3_TITLE]):
                obj.manifest_card_3_title = NEW_MANIFEST_CARD_3_TITLE
                changed = True
            if should_overwrite(obj.manifest_card_3_text, [OLD_MANIFEST_CARD_3_TEXT]):
                obj.manifest_card_3_text = NEW_MANIFEST_CARD_3_TEXT
                changed = True

            if changed:
                obj.save()

    except Exception:
        return


# =========================
# ✅ CMS: ALL TEXTS + QUESTIONS for Membrie Wizard (Wagtail Settings)
# =========================
class MembrieQuestionBlock(blocks.StructBlock):
    key = blocks.CharBlock(
        required=True,
        max_length=60,
        help_text="Cheie unică (ex: art_relationship). Doar litere mici, cifre și underscore.",
    )
    question_text = blocks.CharBlock(required=True, max_length=255, label="Întrebare")
    suggested_answer = blocks.TextBlock(
        required=False,
        label="Sugestie / placeholder",
        help_text="Text hint afișat în textarea.",
    )
    required = blocks.BooleanBlock(required=False, default=True)
    is_active = blocks.BooleanBlock(required=False, default=True)
    order = blocks.IntegerBlock(required=False, default=0)

    def clean(self, value):
        value = super().clean(value)
        k = (value.get("key") or "").strip()

        import re
        if not re.fullmatch(r"[a-z0-9_]+", k):
            raise blocks.StreamBlockValidationError(
                block_errors={
                    "key": ["Cheia trebuie să conțină doar litere mici, cifre și underscore (ex: art_relationship)."]
                }
            )

        value["key"] = k
        return value

    class Meta:
        icon = "help"
        label = "Întrebare"


@register_setting
class MembrieFormContent(BaseSiteSetting):
    form_kicker = models.CharField(max_length=80, blank=True, default="( APLICAȚIE )")
    form_title = models.CharField(
        max_length=255,
        blank=True,
        default="Solicită acces la\ncomunitatea noastră.",
        help_text="Titlul mare din formular (poți folosi \\n pentru line-break).",
    )
    loading_text = models.CharField(max_length=120, blank=True, default="Se încarcă formularul…")

    step_label_template = models.CharField(
        max_length=120,
        blank=True,
        default="Pasul {step} din {total}",
        help_text="Template. Variabile: {step}, {total}.",
    )
    final_label = models.CharField(max_length=60, blank=True, default="Final")

    back_button = models.CharField(max_length=60, blank=True, default="Înapoi")
    continue_button = models.CharField(max_length=60, blank=True, default="Continuă")
    submit_button = models.CharField(max_length=120, blank=True, default="Trimite candidatura")
    submitting_button = models.CharField(max_length=120, blank=True, default="Se trimite…")

    step1_title = models.CharField(max_length=120, blank=True, default="Detalii Părinte")
    step1_subtitle = models.CharField(
        max_length=255, blank=True, default="Datele vor fi folosite doar pentru a te contacta."
    )
    parent_name_label = models.CharField(max_length=120, blank=True, default="Nume complet")
    parent_name_placeholder = models.CharField(max_length=255, blank=True, default="Numele și prenumele")
    phone_label = models.CharField(max_length=120, blank=True, default="Telefon")
    phone_placeholder = models.CharField(max_length=255, blank=True, default="+40 7XX XXX XXX")
    email_label = models.CharField(max_length=120, blank=True, default="Email")
    email_placeholder = models.CharField(max_length=255, blank=True, default="email@exemplu.ro")

    step2_title = models.CharField(max_length=120, blank=True, default="Detalii Copil")
    step2_subtitle = models.CharField(
        max_length=255, blank=True, default="Doar informațiile necesare pentru a înțelege profilul."
    )
    child_name_label = models.CharField(max_length=120, blank=True, default="Numele copilului")
    child_name_placeholder = models.CharField(max_length=255, blank=True, default="Numele copilului")
    child_age_label = models.CharField(max_length=120, blank=True, default="Vârsta")
    child_age_placeholder = models.CharField(
        max_length=255, blank=True, default="Selectează vârsta (minim 4 ani)"
    )

    step3_title_fallback = models.CharField(max_length=120, blank=True, default="Relația cu Arta")
    step3_subtitle_fallback = models.CharField(
        max_length=255,
        blank=True,
        default="Descrieți, pe scurt, relația copilului cu arta până în prezent.",
    )
    step3_placeholder_fallback = models.CharField(
        max_length=255,
        blank=True,
        default="Ce medii artistice a explorat? Ce îl/o fascinează? Există lucrări de care este mândru/mândră?",
    )
    step3_min_chars_label = models.CharField(
        max_length=120,
        blank=True,
        default="Minim {min} caractere.",
        help_text="Template. Variabile: {min}.",
    )

    step4_title = models.CharField(max_length=120, blank=True, default="Așteptări")
    step4_subtitle = models.CharField(max_length=255, blank=True, default="Ce căutați pentru copilul dumneavoastră?")
    expectation_hobby_title = models.CharField(max_length=80, blank=True, default="Hobby")
    expectation_hobby_desc = models.CharField(
        max_length=255, blank=True, default="Explorare creativă și dezvoltare personală"
    )
    expectation_performance_title = models.CharField(max_length=120, blank=True, default="Performanță")
    expectation_performance_desc = models.CharField(
        max_length=255, blank=True, default="Pregătire pentru o carieră în arte vizuale"
    )

    success_title = models.CharField(max_length=255, blank=True, default="Aplicația a fost înregistrată.")
    success_subtitle = models.CharField(
        max_length=255, blank=True, default="Comitetul de admitere vă va contacta în 48h."
    )
    success_reset_button = models.CharField(max_length=120, blank=True, default="Trimite o nouă aplicație")

    questions = StreamField(
        [
            ("question", MembrieQuestionBlock()),
        ],
        blank=True,
        use_json_field=True,
    )

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("form_kicker"),
                FieldPanel("form_title"),
                FieldPanel("loading_text"),
            ],
            heading="Intro / Header",
        ),
        MultiFieldPanel(
            [
                FieldPanel("step_label_template"),
                FieldPanel("final_label"),
            ],
            heading="Progress / Labels",
        ),
        MultiFieldPanel(
            [
                FieldPanel("back_button"),
                FieldPanel("continue_button"),
                FieldPanel("submit_button"),
                FieldPanel("submitting_button"),
            ],
            heading="Buttons",
        ),
        MultiFieldPanel(
            [
                FieldPanel("step1_title"),
                FieldPanel("step1_subtitle"),
                FieldPanel("parent_name_label"),
                FieldPanel("parent_name_placeholder"),
                FieldPanel("phone_label"),
                FieldPanel("phone_placeholder"),
                FieldPanel("email_label"),
                FieldPanel("email_placeholder"),
            ],
            heading="Step 1 — Părinte",
        ),
        MultiFieldPanel(
            [
                FieldPanel("step2_title"),
                FieldPanel("step2_subtitle"),
                FieldPanel("child_name_label"),
                FieldPanel("child_name_placeholder"),
                FieldPanel("child_age_label"),
                FieldPanel("child_age_placeholder"),
            ],
            heading="Step 2 — Copil",
        ),
        MultiFieldPanel(
            [
                FieldPanel("step3_title_fallback"),
                FieldPanel("step3_subtitle_fallback"),
                FieldPanel("step3_placeholder_fallback"),
                FieldPanel("step3_min_chars_label"),
            ],
            heading="Step 3 — Relația cu Arta (fallback)",
        ),
        MultiFieldPanel(
            [
                FieldPanel("step4_title"),
                FieldPanel("step4_subtitle"),
                FieldPanel("expectation_hobby_title"),
                FieldPanel("expectation_hobby_desc"),
                FieldPanel("expectation_performance_title"),
                FieldPanel("expectation_performance_desc"),
            ],
            heading="Step 4 — Așteptări",
        ),
        MultiFieldPanel(
            [
                FieldPanel("success_title"),
                FieldPanel("success_subtitle"),
                FieldPanel("success_reset_button"),
            ],
            heading="Success",
        ),
        MultiFieldPanel(
            [
                FieldPanel("questions"),
            ],
            heading="Întrebări (formular)",
        ),
    ]


@receiver(post_migrate)
def ensure_default_membrie_form_content(sender, **kwargs):
    try:
        if sender and getattr(sender, "name", "") and sender.name != "core":
            return

        sites = Site.objects.all()
        for site in sites:
            obj = MembrieFormContent.for_site(site)

            if not obj.questions:
                obj.questions = [
                    ("question", {
                        "key": "art_relationship",
                        "question_text": "Descrieți relația copilului cu arta până în prezent.",
                        "suggested_answer": "Ce medii artistice a explorat? Ce îl/o fascinează? Există lucrări de care este mândru/mândră?",
                        "required": True,
                        "is_active": True,
                        "order": 1,
                    }),
                    ("question", {
                        "key": "child_personality",
                        "question_text": "Cum ați descrie personalitatea copilului?",
                        "suggested_answer": "Este introvertit/extrovertit? Răbdător? Observator? Curios?",
                        "required": False,
                        "is_active": True,
                        "order": 2,
                    }),
                    ("question", {
                        "key": "previous_experience",
                        "question_text": "A mai participat la cursuri sau ateliere artistice?",
                        "suggested_answer": "Unde? Ce tip de activitate? Ce i-a plăcut cel mai mult?",
                        "required": False,
                        "is_active": True,
                        "order": 3,
                    }),
                ]
                obj.save()

    except Exception:
        return


class MembershipQuestion(models.Model):
    key = models.SlugField(max_length=60, unique=True)
    question_text = models.CharField(max_length=255)
    suggested_answer = models.TextField(blank=True, default="")
    required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Întrebare (Membrie) [legacy]"
        verbose_name_plural = "Întrebări (Membrie) [legacy]"

    def __str__(self):
        return f"{self.order}. {self.question_text}"


class MembershipApplication(models.Model):
    EXPECTATION_CHOICES = (
        ("hobby", "Hobby"),
        ("performance", "Performanță"),
    )

    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    parent_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=50)
    email = models.EmailField(db_index=True)

    child_name = models.CharField(max_length=120)
    child_age = models.CharField(max_length=20)

    expectation = models.CharField(max_length=20, choices=EXPECTATION_CHOICES)
    source = models.CharField(max_length=60, blank=True, default="website")

    art_relationship = models.TextField(blank=True, default="")

    qa_json = models.JSONField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")

    raw_payload = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Aplicație Membrie"
        verbose_name_plural = "Aplicații Membrie"

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d} — {self.parent_name} / {self.child_name}"


class MembershipQAItem(models.Model):
    application = models.ForeignKey(
        MembershipApplication, related_name="qa_items", on_delete=models.CASCADE
    )
    question = models.CharField(max_length=255)
    answer = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Q&A item"
        verbose_name_plural = "Q&A items"

    def __str__(self):
        return self.question


# ============================================================
# ✅ NEWSLETTER (SERIOUS) — pending confirm + confirm token
# ============================================================
class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    source = models.CharField(max_length=60, blank=True, default="website")

    # active only after confirm
    is_active = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    # token for confirmation link
    confirm_token = models.CharField(max_length=128, blank=True, default="")
    confirm_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Abonat Newsletter"
        verbose_name_plural = "Abonați Newsletter"

    def __str__(self):
        return self.email


class JurnalIndexPage(Page):
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
    category = models.CharField(max_length=60, blank=True, default="FILOSOFIE")
    excerpt = models.TextField(blank=True, default="")

    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    meta = models.CharField(max_length=80, blank=True, default="6 min · Atelier")
    body = RichTextField(blank=True, features=["h2", "h3", "bold", "italic", "ol", "ul", "link"])

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
        MultiFieldPanel(
            [
                InlinePanel("gallery_images", label="Imagini galerie"),
            ],
            heading="Galerie imagini (pentru slider / carduri)",
        ),
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