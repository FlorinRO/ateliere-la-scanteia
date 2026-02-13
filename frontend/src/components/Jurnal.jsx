// Jurnal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import jurnal1 from "../assets/jurnal1.jpeg";
import jurnal2 from "../assets/jurnal2.jpeg";
import jurnal3 from "../assets/jurnal3.jpeg";

/**
 * Jurnal – editorial grid + separate page per article (SEO friendly).
 * Routes expected:
 *  - /jurnal (grid)
 *  - /jurnal/:slug (article page)
 *
 * Headless (Wagtail):
 *  - GET /api/jurnal/
 *  - GET /api/jurnal/:slug/
 */

// Local fallbacks (used if API is empty/unavailable)
const FALLBACK_ARTICLES = [
  {
    slug: "greseala-cel-mai-bun-profesor",
    category: "FILOSOFIE",
    title: "De ce „greșeala” este cel mai bun profesor de artă",
    image: jurnal1,
    excerpt:
      "În atelier, greșeala nu e eșec. E material brut pentru observație, curaj și limbaj vizual.",
    body: [
      "În educația estetică, greșeala e un instrument – nu o rușine. Când copilul înțelege că o linie „ratată” poate deveni o idee nouă, se naște libertatea de a explora.",
      "În loc de corecturi rapide, lucrăm cu întrebări: Ce se întâmplă dacă? Cum se schimbă compoziția dacă mutăm centrul de greutate? Ce poveste spune pata?",
      "Așa apar ritmul, intenția și disciplina blândă: nu pentru note, ci pentru un limbaj personal care crește în timp.",
    ],
    meta: "6 min · Atelier",
  },
  {
    slug: "materialele-conteaza",
    category: "MATERIALE",
    title:
      "Materialele contează: de la tempera de supermarket la pigment profesionist",
    image: jurnal2,
    excerpt:
      "Diferența dintre „merge” și „se simte bine” vine adesea din material: densitate, granulație, lumină.",
    body: [
      "Materialele nu sunt un moft. Sunt un profesor tăcut. Un pigment bun îți arată imediat ce înseamnă transparență, stratificare și răbdare.",
      "La început, scopul nu e luxul, ci consistența: să poți repeta un gest și să înveți din el. Când materialul e imprevizibil, copilul învață frustrare – nu artă.",
      "Alegem instrumente care răsplătesc atenția: hârtie cu textură, pensule care țin apă, culori care nu „mor” pe foaie.",
    ],
    meta: "8 min · Practică",
  },
  {
    slug: "spatiul-ca-mentor",
    category: "SPAȚIU",
    title: "Spațiul ca mentor: cum arhitectura influențează creativitatea",
    image: jurnal3,
    excerpt:
      "Lumina, liniștea și proporțiile nu sunt decor. Sunt condiții care modelează atenția.",
    body: [
      "Un spațiu coerent invită la lucru profund. Lumina bună reduce graba. Ordinea reduce anxietatea. Aerul și distanțele dau curaj.",
      "Când copilul intră într-un loc care respectă actul artistic, își schimbă postura: devine mai atent, mai prezent.",
      "Într-un atelier, arhitectura devine un cadru moral: aici avem voie să încercăm, să repetăm și să tăcem.",
    ],
    meta: "7 min · Observație",
  },
];

function normalizeListPayload(json) {
  const items = Array.isArray(json?.items) ? json.items : [];
  const index = json?.index || null;

  const normalizedItems = items
    .map((a) => ({
      slug: typeof a?.slug === "string" ? a.slug : "",
      category: typeof a?.category === "string" ? a.category : "",
      title: typeof a?.title === "string" ? a.title : "",
      image: typeof a?.image === "string" && a.image ? a.image : null,
      excerpt: typeof a?.excerpt === "string" ? a.excerpt : "",
      meta: typeof a?.meta === "string" ? a.meta : "",
    }))
    .filter((a) => a.slug && a.title);

  const normalizedIndex = index
    ? {
        label:
          typeof index?.label === "string"
            ? index.label
            : "( ARHIVA SCÂNTEIA )",
        title:
          typeof index?.title === "string"
            ? index.title
            : "Jurnalul atelierului",
        subtitle:
          typeof index?.subtitle === "string"
            ? index.subtitle
            : "— note despre artă",
        intro:
          typeof index?.intro === "string"
            ? index.intro
            : "- Gânduri scurte, blânde și practice despre procesul creativ al copiilor: materiale, spațiu, curaj și bucuria de a încerca.",
      }
    : null;

  return { index: normalizedIndex, items: normalizedItems };
}

export default function Jurnal() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/jurnal/", { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`Failed to load jurnal list: ${r.status}`);
        return data;
      })
      .then((data) => setCms(normalizeListPayload(data)))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setCms(null);
      });

    return () => controller.abort();
  }, []);

  const index = cms?.index || {
    label: "( ARHIVA SCÂNTEIA )",
    title: "Jurnalul atelierului",
    subtitle: "— note despre artă",
    intro:
      "- Gânduri scurte, blânde și practice despre procesul creativ al copiilor: materiale, spațiu, curaj și bucuria de a încerca.",
  };

  const articles = cms?.items && cms.items.length ? cms.items : FALLBACK_ARTICLES;
  const visibleArticles = useMemo(() => articles.slice(0, 3), [articles]);

  return (
    <section
      id="jurnal"
      className="relative mt-16 overflow-hidden bg-[#F6F1E7] pb-16 pt-24 sm:mt-24 sm:pb-20 sm:pt-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-28 bg-gradient-to-b from-white via-[#F6F1E7] to-[#F6F1E7]" />
      <div className="pointer-events-none absolute -right-24 top-40 z-0 h-80 w-80 rounded-full bg-ink-900/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <header className="max-w-7xl">
          <p className="text-xs tracking-[0.28em] text-accent-700">
            {index.label}
          </p>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-ink-900 sm:text-6xl">
              {index.title}
              <span className="italic"> {index.subtitle}</span>
            </h2>

            <Link
              to="/jurnal"
              className={[
                "ml-auto",
                "shrink-0 rounded-2xl border border-accent-700/25 bg-white/60 px-5 py-3",
                "text-xs tracking-[0.22em] text-ink-800",
                "shadow-[0_14px_40px_rgba(0,0,0,0.08)]",
                "transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/70",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]",
              ].join(" ")}
              aria-label="Vezi toate articolele"
            >
              VEZI TOATE ARTICOLELE →
            </Link>
          </div>

          <p className="mt-6 max-w-4xl text-[15px] italic leading-relaxed text-ink-700/90 sm:text-[16px]">
            {index.intro}
          </p>
        </header>

        <div className="mt-12 grid gap-8 sm:mt-14 sm:gap-10 lg:grid-cols-3">
          {visibleArticles.map((a) => (
            <ArticleCard key={a.slug} a={a} to={`/jurnal/${a.slug}`} />
          ))}
        </div>

        <div className="pointer-events-none mt-14 h-px w-full bg-gradient-to-r from-transparent via-ink-200/60 to-transparent" />
      </div>
    </section>
  );
}

export function JurnalAllPage() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/jurnal/", { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`Failed to load jurnal list: ${r.status}`);
        return data;
      })
      .then((data) => setCms(normalizeListPayload(data)))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setCms(null);
      });

    return () => controller.abort();
  }, []);

  const index = cms?.index || { label: "( ARHIVA SCÂNTEIA )" };
  const articles = cms?.items && cms.items.length ? cms.items : FALLBACK_ARTICLES;

  return (
    <section className="relative overflow-hidden bg-[#F6F1E7] pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-28 bg-gradient-to-b from-white via-[#F6F1E7] to-[#F6F1E7]" />
      <div className="pointer-events-none absolute -right-24 top-40 z-0 h-80 w-80 rounded-full bg-ink-900/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs tracking-[0.28em] text-accent-700">
              {index.label}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] text-ink-900 sm:text-6xl">
              Toate articolele
              <span className="italic"> — jurnalul atelierului</span>
            </h1>
            <p className="mt-6 max-w-3xl text-[15px] italic leading-relaxed text-ink-700/90 sm:text-[16px]">
              - Aici găsești toate articolele publicate.
            </p>
          </div>

          <Link
            to="/#jurnal"
            className={[
              "shrink-0 rounded-2xl border border-accent-700/25 bg-white/60 px-5 py-3",
              "text-xs tracking-[0.22em] text-ink-800",
              "shadow-[0_14px_40px_rgba(0,0,0,0.08)]",
              "transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/70",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]",
            ].join(" ")}
          >
            ← ÎNAPOI ACASĂ
          </Link>
        </div>

        <div className="mt-12 grid gap-8 sm:mt-14 sm:gap-10 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} a={a} to={`/jurnal/${a.slug}`} />
          ))}
        </div>

        <div className="pointer-events-none mt-14 h-px w-full bg-gradient-to-r from-transparent via-ink-200/60 to-transparent" />
      </div>
    </section>
  );
}

function ArticleCard({ a, to }) {
  const cardRef = useRef(null);

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);

    const w = rect.width || 1;
    const h = rect.height || 1;

    const dTop = y;
    const dBottom = h - y;
    const dLeft = x;
    const dRight = w - x;

    const min = Math.min(dTop, dBottom, dLeft, dRight);
    const TH = 100;
    const t = Math.max(0, Math.min(1, (TH - min) / TH));

    const topOn = min === dTop ? 1 : 0;
    const rightOn = min === dRight ? 1 : 0;
    const bottomOn = min === dBottom ? 1 : 0;
    const leftOn = min === dLeft ? 1 : 0;

    el.style.setProperty("--bTop", String(topOn * t));
    el.style.setProperty("--bRight", String(rightOn * t));
    el.style.setProperty("--bBottom", String(bottomOn * t));
    el.style.setProperty("--bLeft", String(leftOn * t));
  };

  const onEnter = (e) => onMove(e);

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--bTop", "0");
    el.style.setProperty("--bRight", "0");
    el.style.setProperty("--bBottom", "0");
    el.style.setProperty("--bLeft", "0");
  };

  return (
    <Link
      ref={cardRef}
      to={to}
      aria-label={a.title}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={[
        "group relative overflow-hidden rounded-[2.25rem] text-left",
        "border border-ink-200/80 bg-white/55",
        "shadow-[0_30px_90px_rgba(0,0,0,0.10)]",
        "transition-transform duration-500 ease-out hover:-translate-y-1",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]",
        "backdrop-blur-[2px]",
      ].join(" ")}
    >
      <div className="relative">
        <div className="relative overflow-hidden">
          <img
            src={a.image || jurnal1}
            alt={a.title}
            loading="lazy"
            draggable="false"
            className={[
              "h-[360px] w-full object-cover sm:h-[420px]",
              "transition-transform duration-[900ms] ease-out",
              "group-hover:scale-[1.12]",
            ].join(" ")}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(240px circle at var(--mx) var(--my), rgba(185,28,28,0.26), rgba(185,28,28,0.14) 35%, rgba(185,28,28,0.07) 55%, transparent 72%)",
            }}
          />

          <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
            <div
              className="absolute left-0 right-0 top-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(185,28,28,0.85), transparent)",
                opacity: "var(--bTop, 0)",
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-[2px]"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(185,28,28,0.85), transparent)",
                opacity: "var(--bRight, 0)",
              }}
            />
            <div
              className="absolute left-0 right-0 bottom-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(185,28,28,0.85), transparent)",
                opacity: "var(--bBottom, 0)",
              }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(185,28,28,0.85), transparent)",
                opacity: "var(--bLeft, 0)",
              }}
            />
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-6">
            <div className="inline-flex items-center gap-3">
              <span className="text-[11px] tracking-[0.30em] text-white/75">
                {a.category}
              </span>
              <span className="h-px w-10 bg-white/40" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <div className="pointer-events-none absolute right-5 top-5 z-20">
            <div
              className={[
                "rounded-2xl border border-white/25 bg-white/10 px-4 py-2",
                "text-[11px] tracking-[0.28em] text-white backdrop-blur",
                "opacity-0 translate-y-1 transition-all duration-300",
                "group-hover:opacity-100 group-hover:translate-y-0",
              ].join(" ")}
            >
              CITEȘTE
            </div>
          </div>
        </div>

        <div className="relative z-20 px-7 pb-8 pt-6">
          <p className="text-[11px] tracking-[0.26em] text-ink-500">{a.meta}</p>

          <h3 className="mt-3 text-[28px] font-semibold leading-[1.08] text-ink-900">
            {a.title}
          </h3>

          <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-ink-700">
            {a.excerpt}
          </p>

          <div className="mt-7 inline-flex items-center gap-3 text-xs tracking-[0.22em] text-accent-700">
            <span className="font-medium">CITEȘTE ARTICOLUL</span>
            <span className="h-px w-10 bg-accent-700/60 transition-all duration-300 group-hover:w-16" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleBody({ a }) {
  // A “nice article” feel: comfortable measure, better rhythm, subtle accents.
  const baseClass = [
    "mx-auto max-w-[72ch]",
    "text-[16px] leading-[1.95] text-ink-800/90 sm:text-[18px]",
    // typography via selectors
    "[&_p]:mt-0 [&_p]:leading-[1.95]",
    "[&_p+_p]:mt-6",
    "[&_strong]:text-ink-900 [&_strong]:font-semibold",
    "[&_em]:text-ink-800/90",
    "[&_a]:text-accent-700 [&_a]:underline [&_a]:decoration-accent-700/30 [&_a]:underline-offset-4",
    "[&_a:hover]:decoration-accent-700/70",
    "[&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-ink-900",
    "sm:[&_h2]:text-[26px]",
    "[&_h3]:mt-8 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-ink-900",
    "sm:[&_h3]:text-[20px]",
    "[&_blockquote]:mt-8 [&_blockquote]:rounded-2xl [&_blockquote]:border [&_blockquote]:border-ink-200/70",
    "[&_blockquote]:bg-white/55 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-ink-800/90 [&_blockquote]:shadow-[0_18px_60px_rgba(0,0,0,0.06)]",
    "sm:[&_blockquote]:px-6 sm:[&_blockquote]:py-5",
    "[&_ul]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2",
    "[&_ol]:mt-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2",
    // subtle drop cap for first paragraph (works for both html and mapped paragraphs)
    "[&_.dropcap:first-letter]:float-left [&_.dropcap:first-letter]:mr-3 [&_.dropcap:first-letter]:mt-1",
    "[&_.dropcap:first-letter]:text-5xl [&_.dropcap:first-letter]:font-semibold [&_.dropcap:first-letter]:leading-none [&_.dropcap:first-letter]:text-ink-900",
  ].join(" ");

  if (typeof a?.body_html === "string" && a.body_html.trim()) {
    // Add a wrapper to enable dropcap on first paragraph via CSS selectors
    return (
      <div className={baseClass}>
        <div
          className="[&>p:first-child]:dropcap"
          dangerouslySetInnerHTML={{ __html: a.body_html }}
        />
      </div>
    );
  }

  if (Array.isArray(a?.body) && a.body.length) {
    return (
      <div className={baseClass}>
        {a.body.map((p, idx) => (
          <p key={idx} className={idx === 0 ? "dropcap" : ""}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <p className="dropcap">Conținut indisponibil.</p>
    </div>
  );
}

export function JurnalArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState("loading"); // Initial state set to "loading"

  const fallbackArticle = useMemo(
    () => FALLBACK_ARTICLES.find((x) => x.slug === slug) || null,
    [slug]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/jurnal/${slug}/`, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);

        if (r.status === 404) {
          setStatus("not_found");
          setArticle(null);
          return null;
        }

        if (!r.ok) throw new Error(`Failed to load jurnal detail: ${r.status}`);

        const d = data?.detail;
        if (!d) {
          setStatus("error");
          setArticle(null);
          return null;
        }

        setArticle({
          slug: typeof d?.slug === "string" ? d.slug : slug,
          category: typeof d?.category === "string" ? d.category : "",
          title: typeof d?.title === "string" ? d.title : "",
          image: typeof d?.image === "string" && d.image ? d.image : null,
          excerpt: typeof d?.excerpt === "string" ? d.excerpt : "",
          meta: typeof d?.meta === "string" ? d.meta : "",
          body_html: typeof d?.body_html === "string" ? d.body_html : "",
        });

        setStatus("ok");
        return null;
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setStatus("error");
        setArticle(null);
      });

    return () => controller.abort();
  }, [slug]);

  const a = article || fallbackArticle;

  if (status === "not_found" && !fallbackArticle) {
    return (
      <section className="relative bg-[#F6F1E7] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs tracking-[0.26em] text-accent-600">( JURNAL )</p>
          <h1 className="mt-4 text-4xl font-semibold text-ink-900 sm:text-5xl">
            Articolul nu a fost găsit.
          </h1>
          <Link
            to="/#jurnal"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-accent-700/25 bg-white/60 px-5 py-3 text-xs tracking-[0.22em] text-ink-800 shadow-[0_14px_40px_rgba(0,0,0,0.08)] hover:border-accent-700/45 hover:bg-white/70"
          >
            ← ÎNAPOI LA JURNAL
            <span className="h-px w-10 bg-ink-400/70" />
          </Link>
        </div>
      </section>
    );
  }

  // If API is still loading, we can still render fallback immediately (nice UX)
  if (!a) return null;

  return (
    <article className="relative overflow-hidden bg-[#F6F1E7] pb-12 pt-24 sm:pb-16 sm:pt-28">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-accent-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-48 h-96 w-96 rounded-full bg-ink-900/5 blur-3xl" />

      {/* NOTE: px-0 on mobile so cards can touch screen sides */}
      <div className="mx-auto max-w-6xl px-0 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-0">
          <div>
            <p className="text-xs tracking-[0.28em] text-accent-700">
              ( ARHIVA SCÂNTEIA )
            </p>
            <p className="mt-2 text-[12px] tracking-[0.22em] text-ink-500">
              {a.category} · {a.meta}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/jurnal"
              className="inline-flex items-center gap-3 rounded-2xl border border-accent-700/25 bg-white/60 px-5 py-3 text-xs tracking-[0.22em] text-ink-800 shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/75 hover:shadow-[0_22px_60px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
            >
              ← VEZI TOATE ARTICOLELE
              <span className="h-px w-10 bg-ink-400/70" />
            </Link>

            <Link
              to="/#jurnal"
              className="inline-flex items-center gap-3 rounded-2xl border border-accent-700/25 bg-white/60 px-5 py-3 text-xs tracking-[0.22em] text-ink-800 shadow-[0_14px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/75 hover:shadow-[0_22px_60px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
            >
              ← ÎNAPOI LA JURNAL
              <span className="h-px w-10 bg-ink-400/70" />
            </Link>
          </div>
        </div>

        {/* HEADER IMAGE (keep as-is for desktop) */}
        <header className="mt-8 overflow-hidden rounded-none border-y border-ink-200/70 bg-white/60 shadow-[0_50px_140px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:rounded-[2.5rem] sm:border sm:mx-0">
          <div className="relative h-[320px] sm:h-[420px]">
            <img
              src={a.image || jurnal1}
              alt={a.title}
              className="h-full w-full object-cover"
              draggable="false"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/10" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-black/25 blur-2xl" />
              <div className="relative">
                <h1 className="text-3xl font-semibold leading-[1.04] text-white sm:text-5xl">
                  {a.title}
                </h1>
                <p className="mt-4 max-w-3xl text-[15px] italic leading-relaxed text-white/85">
                  - {a.excerpt}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE: merged stack (text card directly under image, DESPRE ARTICOL directly under text, no side gaps) */}
        <div className="mt-0 lg:hidden">
          <div className="overflow-hidden rounded-none border-y border-ink-200/70 bg-white/55 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px] sm:mt-10 sm:rounded-[2.25rem] sm:border">
            {/* MAIN TEXT */}
            <section className="px-6 pb-10 pt-8 sm:px-10 sm:pt-10">
              <p className="sr-only">Conținut articol</p>

              <ArticleBody a={a} />

              <div className="mt-10 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-ink-200/80" />
                <span className="text-[11px] italic tracking-[0.18em] text-ink-500">
                  Arhiva Scânteia
                </span>
                <span className="h-px w-10 bg-ink-200/80" />
              </div>
            </section>

            {/* DESPRE ARTICOL (mobile: merged, directly under main text) */}
            <section className="border-t border-ink-200/70 px-6 py-8 sm:px-10">

              {/* Removed: Categorie / Durată / Stil */}
              <p className="mt-5 text-[13px] leading-relaxed text-ink-600">
                Pentru înscrieri și întrebări, scrie-ne. Îți răspundem rapid cu
                detalii despre grupe, program și materiale.
              </p>

              <Link
                to="/#membrie"
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-accent-700 px-5 py-3 text-xs tracking-[0.24em] text-white shadow-[0_18px_50px_rgba(185,28,28,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-800 hover:shadow-[0_26px_70px_rgba(185,28,28,0.30)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
              >
                ÎNSCRIE-TE
              </Link>
            </section>

            {/* FOOTER ACTIONS */}
            <section className="border-t border-ink-200/70 px-6 py-6 sm:px-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/#jurnal"
                  className="inline-flex items-center gap-3 rounded-2xl border border-accent-700/25 bg-white/70 px-5 py-3 text-xs tracking-[0.22em] text-ink-800 shadow-[0_12px_34px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/85 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
                >
                  ← ÎNAPOI LA JURNAL
                  <span className="h-px w-10 bg-ink-400/70" />
                </Link>

                <span className="text-xs tracking-[0.22em] text-ink-500">
                  Ateliere la Scânteia · Jurnal
                </span>
              </div>
            </section>
          </div>
        </div>

        {/* DESKTOP: original 2-col, but without NAVIGARE card and without details list in DESPRE ARTICOL */}
        <div className="mt-10 hidden gap-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-12">
          <section className="rounded-[2.25rem] border border-ink-200/70 bg-white/55 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
            <p className="sr-only">Conținut articol</p>

            <ArticleBody a={a} />

            <div className="mt-10 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-ink-200/80" />
              <span className="text-[11px] italic tracking-[0.18em] text-ink-500">
                Arhiva Scânteia
              </span>
              <span className="h-px w-10 bg-ink-200/80" />
            </div>

            <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-ink-200/55 to-transparent" />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/#jurnal"
                className="inline-flex items-center gap-3 rounded-2xl border border-accent-700/25 bg-white/70 px-5 py-3 text-xs tracking-[0.22em] text-ink-800 shadow-[0_12px_34px_rgba(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/85 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
              >
                ← ÎNAPOI LA JURNAL
                <span className="h-px w-10 bg-ink-400/70" />
              </Link>

              <span className="text-xs tracking-[0.22em] text-ink-500">
                Ateliere la Scânteia · Jurnal
              </span>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[2.25rem] border border-ink-200/70 bg-white/55 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">

              {/* Removed: Categorie / Durată / Stil */}
              <p className="mt-6 text-[13px] leading-relaxed text-ink-600">
                Pentru înscrieri și întrebări, scrie-ne. Îți răspundem rapid cu
                detalii despre grupe, program și materiale.
              </p>

              <Link
                to="/#membrie"
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-accent-700 px-5 py-3 text-xs tracking-[0.24em] text-white shadow-[0_18px_50px_rgba(185,28,28,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-800 hover:shadow-[0_26px_70px_rgba(185,28,28,0.30)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]"
              >
                ÎNSCRIE-TE
              </Link>
            </div>

            {/* Removed completely: ( NAVIGARE ) card */}
          </aside>
        </div>
      </div>
    </article>
  );
}
