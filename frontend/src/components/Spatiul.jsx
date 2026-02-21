// Spatiul.jsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import spatiulImg1 from "../assets/spatiul1.jpeg";
import spatiulImg2 from "../assets/spatiul2.jpeg";
import { useLocation, useNavigate } from "react-router-dom";

function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function splitLines(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function cleanText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ✅ Fix for “words jump to next line too early”
 * In CMS textareas, people often paste content that contains HARD line breaks
 * (newlines) inside a paragraph. Your previous splitLines() turned EACH newline
 * into a new <p>, which visually looks like “it wraps even if there's space”.
 *
 * This helper:
 * - keeps real paragraph breaks (blank lines)
 * - removes single newlines inside paragraphs (joins them with spaces)
 */
function splitParagraphs(text) {
  if (!text) return [];
  const raw = String(text).replace(/\r\n/g, "\n");

  // split by blank line(s) => paragraph boundaries
  const paras = raw
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n+/g, " ")) // join hard line breaks inside paragraph
    .map((p) => cleanText(p))
    .filter(Boolean);

  return paras;
}

function normForCompare(s) {
  return cleanText(s).toLowerCase();
}

/**
 * Make sure we always render Filosofie title as 2 clean lines:
 *   Sanctuar privat.
 *   Libertate radicală.
 * even if CMS sends "Sanctuar privat. Libertate radicală." + "Libertate radicală."
 */
function normalizeTwoLineTitle(raw1, raw2) {
  const a = cleanText(raw1);
  const b = cleanText(raw2);

  const nl = splitLines(a);
  if (nl.length >= 2) {
    const t1 = nl[0];
    const t2 = nl.slice(1).join(" ");
    if (normForCompare(t1) === normForCompare(t2)) return { t1, t2: "" };
    return { t1, t2 };
  }

  if (b && normForCompare(a).includes(normForCompare(b))) {
    const parts = a
      .split(/(?<=[.!?])\s+/)
      .map((x) => cleanText(x))
      .filter(Boolean);

    if (parts.length >= 2) {
      const t1 = parts[0];
      const t2 = parts.slice(1).join(" ");
      if (normForCompare(t2) === normForCompare(b)) return { t1, t2: b };
      return { t1, t2 };
    }

    if (normForCompare(a) === normForCompare(b)) return { t1: a, t2: "" };
    return {
      t1: a.replace(new RegExp(`\\s*${b}\\s*`, "i"), "").trim() || a,
      t2: b,
    };
  }

  if (b && normForCompare(a) === normForCompare(b)) return { t1: a, t2: "" };
  return { t1: a, t2: b };
}

/**
 * ✅ No setState in effect (passes react-hooks/set-state-in-effect)
 * Uses useSyncExternalStore (React 18).
 */
function useMediaQuery(query) {
  const getSnapshot = () => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  const subscribe = (callback) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mql = window.matchMedia(query);

    const onChange = () => callback();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function useInView(options = { threshold: 0.18 }, rootEl = null) {
  const ref = useRef(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [inView, setInView] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced) return;

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { ...options, root: rootEl }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options, prefersReduced, rootEl]);

  return [ref, inView];
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function useScrollProgress(ref, scrollEl) {
  const [p, setP] = useState(0);

  useEffect(() => {
    const scrollTarget = scrollEl?.current || window;
    let raf = 0;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const raw = (vh - r.top) / (vh + r.height);
      setP(clamp01(raw));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, scrollEl]);

  return p;
}

/**
 * ✅ Delayed reveal that RE-RUNS, without setState sync inside effect body
 */
function useDelayedReveal(when, delayMs = 180) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let t = null;
    let cancelled = false;

    if (when) {
      t = setTimeout(() => {
        if (cancelled) return;
        setOn(true);
      }, delayMs);
    }

    return () => {
      cancelled = true;
      if (t) clearTimeout(t);

      if (!when) return;

      requestAnimationFrame(() => setOn(false));
    };
  }, [when, delayMs]);

  return on;
}

/** Single “card” like SPAȚIUL */
function ReadableLines({ lines, variant = "body", accent = true }) {
  const safe = Array.isArray(lines) ? lines.filter(Boolean) : [];
  if (!safe.length) return null;

  const isSEO = variant === "seo";

  return (
    <div
      className={[
        "mt-4 max-w-prose",
        "rounded-2xl",
        isSEO
          ? "bg-white/45 ring-1 ring-black/5"
          : "bg-white/55 ring-1 ring-black/5 shadow-soft",
        "px-5 py-5",
      ].join(" ")}
    >
      <div
        className={[
          "relative",
          "pl-4",
          accent ? "border-l-2 border-accent-600/25" : "border-l border-ink-200/70",
        ].join(" ")}
      >
        <div className={isSEO ? "space-y-2" : "space-y-3"}>
        {safe.map((line, idx) => (
            <p
              key={idx}
              className={
                isSEO
                  ? "text-[13px] leading-[1.75] text-ink-600"
                  : "text-[15px] leading-[1.85] text-ink-700"
              }
            >
              {line}
            </p>
          ))}
        </div>

        <div className="pointer-events-none absolute -left-[2px] top-0 h-10 w-[2px] bg-gradient-to-b from-accent-600/45 to-transparent" />
      </div>
    </div>
  );
}

/** Single container for multiple blocks (Filosofie should match Spațiul structure) */
function ReadableBlocks({ blocks }) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  const normalized = safeBlocks
    .map((b) => ({
      lines: Array.isArray(b?.lines) ? b.lines.filter(Boolean) : [],
      leadBoldFirst: Boolean(b?.leadBoldFirst),
    }))
    .filter((b) => b.lines.length);

  if (!normalized.length) return null;

  return (
    <div
      className={[
        "mt-4 max-w-prose",
        "rounded-2xl",
        "bg-white/55 ring-1 ring-black/5 shadow-soft",
        "px-5 py-5",
      ].join(" ")}
    >
      <div className="relative pl-4 border-l-2 border-accent-600/25">
        <div className="space-y-6">
          {normalized.map((b, bi) => (
            <div key={bi} className="space-y-3">
              {b.lines.map((line, li) => (
                <p
                  key={li}
                  className={[
                    "text-[15px] leading-[1.85] text-ink-700",
                    b.leadBoldFirst && li === 0 ? "font-medium text-ink-900" : "",
                  ].join(" ")}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute -left-[2px] top-0 h-10 w-[2px] bg-gradient-to-b from-accent-600/45 to-transparent" />
      </div>
    </div>
  );
}

export default function Spatiul({ scrollEl }) {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

  const [cms, setCms] = useState(null);

  const observerRoot = scrollEl?.current || null;

  const isMobile = useMediaQuery("(max-width: 639px)");

  const [wrapRef] = useInView({ threshold: 0.12 }, observerRoot);

  const [imgRef, imgIn] = useInView({ threshold: 0.22 }, observerRoot);
  const [textRef, textIn] = useInView({ threshold: 0.22 }, observerRoot);
  const spP = useScrollProgress(wrapRef, scrollEl);

  const filoWrapOpts = useMemo(() => ({ threshold: 0.16 }), []);

  const filoImgOpts = useMemo(() => {
    return isMobile
      ? { threshold: 0.12, rootMargin: "140px 0px 80px 0px" }
      : { threshold: 0.2, rootMargin: "0px 0px 0px 0px" };
  }, [isMobile]);

  const filoTextOpts = useMemo(() => ({ threshold: 0.2 }), []);

  const [filoWrapRef, filoIn] = useInView(filoWrapOpts, observerRoot);
  const [filoImgRef, filoImgIn] = useInView(filoImgOpts, observerRoot);
  const [filoTextRef, filoTextIn] = useInView(filoTextOpts, observerRoot);

  const filoP = useScrollProgress(filoWrapRef, scrollEl);

  const spQuoteTrigger = imgIn && spP > 0.38;

  const fiProgressThreshold = isMobile ? 0.3 : 0.52;
  const fiQuoteTrigger = filoImgIn && filoP > fiProgressThreshold;

  const spQuoteOn = useDelayedReveal(spQuoteTrigger, 180);
  const fiQuoteDelay = isMobile ? 140 : 220;
  const fiQuoteOn = useDelayedReveal(fiQuoteTrigger, fiQuoteDelay);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mainpage/", { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok)
          throw new Error(`Failed to load mainpage content: ${r.status}`);
        return data;
      })
      .then((data) => setCms(data))
      .catch((err) => {
        if (err?.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  const content = useMemo(() => {
    const sp = cms?.spatiul || {};
    const fi = cms?.filosofie || {};

    const spImage = resolveMediaUrl(sp.image_1) || spatiulImg1;
    const fiImage = resolveMediaUrl(fi.image_2) || spatiulImg2;

    const fallbackSpStats = [
      { value: "4", label: "Copii într-o grupă.", sublabel: "Nu 12, nu 15." },
      {
        value: "100%",
        label: "Lumină naturală",
        sublabel: "Percepția corectă a culorilor.",
      },
      {
        value: "0",
        label: "Zgomot. Presiune.",
        sublabel: "Competiție inutilă.",
      },
    ];

    const spStatsRaw =
      Array.isArray(sp.stats) && sp.stats.length ? sp.stats : fallbackSpStats;

    const spStats = spStatsRaw.map((s) => {
      if (typeof s === "string") return { value: s, label: "", sublabel: "" };
      return {
        value: String(s?.value ?? "").trim(),
        label: String(s?.label ?? "").trim(),
        sublabel: String(s?.sublabel ?? "").trim(),
      };
    });

    const rawTitle1 = (fi.title_line_1 || "Sanctuar privat.").trim();
    const rawTitle2 = (fi.title_line_2 || "Libertate radicală.").trim();
    const normalized = normalizeTwoLineTitle(rawTitle1, rawTitle2);

    return {
      spatiul: {
        label: (sp.label || "( SPAȚIUL )").trim(),
        title: (sp.title || "Spațiul").trim(),
        paragraphLines: splitLines(sp.paragraph).length
          ? splitLines(sp.paragraph)
          : [
              "Căutați un curs de pictură pentru copii în București unde atenția să nu se împartă la 15?",
            ],
        seoBlurbLines: splitLines(sp.seo_blurb),
        hiddenKeywordsRaw: (sp.hidden_keywords || "").trim(),
        image: spImage,
        quote: (
          sp.quote ||
          "Numărul strict limitat de locuri asigură că mentorul este un partener de dialog pentru fiecare copil, nu un supraveghetor."
        ).trim(),
        stats: spStats,
      },
      filosofie: {
        label: (fi.label || "( FILOSOFIA NOASTRĂ )").trim(),
        title1: normalized.t1 || "Sanctuar privat.",
        title2: normalized.t2 || "Libertate radicală.",

        // ✅ IMPORTANT: use splitParagraphs (not splitLines) to avoid hard-wrap look
        introLines: splitParagraphs(fi.intro).length
          ? splitParagraphs(fi.intro)
          : [
              "Răspundem direct celei mai stringente nevoi a părinților: atenția individuală.",
            ],
        p1Lines: splitParagraphs(fi.paragraph_1).length
          ? splitParagraphs(fi.paragraph_1)
          : [
              "Într-un cerc restrâns și securizat, copiii scapă de presiunea notelor și a performanței standardizate. Aici găsesc libertatea radicală de a crea fără frică.",
            ],
        p2Lines: splitParagraphs(fi.paragraph_2).length
          ? splitParagraphs(fi.paragraph_2)
          : [
              "Lucrăm cu materiale profesionale și spațiu vital imens pentru ca cei mici să își testeze limitele creativității într-un mediu sigur.",
            ],

        cta: (fi.cta_text || "SOLICITĂ O INVITAȚIE").trim(),
        image: fiImage,
        quote: (
          fi.quote ||
          "Numărul strict limitat de locuri asigură că mentorul este un partener de dialog pentru fiecare copil, nu un supraveghetor."
        ).trim(),
      },
    };
  }, [cms]);

  const FRAME = "border border-[#6b1f2a]";

  const MINI_CARD_BASE = [
    "rounded-2xl",
    "bg-white/95",
    "backdrop-blur-sm",
    "shadow-[0_18px_60px_rgba(0,0,0,0.14)]",
    "ring-1 ring-black/5",
    "max-w-full overflow-hidden",
    "will-change-transform",
    "transition-[opacity,transform,filter] duration-[820ms] ease-out",
  ].join(" ");

  const MINI_TEXT = [
    "text-[14px] font-medium italic leading-relaxed text-ink-950",
    "break-words [overflow-wrap:anywhere] whitespace-normal",
  ].join(" ");

  const goToMembrie = () => {
    const targetHash = "#membrie";
    if (location?.hash === targetHash) {
      const el = document.getElementById("membrie");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    navigate({ pathname: "/", hash: "membrie" });
  };

  return (
    <>
      <section
        id="spatiul"
        ref={wrapRef}
        className="relative overflow-hidden bg-canvas-bottom pt-1 pb-0 sm:pt-2 sm:pb-0"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[12vh] bg-gradient-to-b from-canvas-bottom/95 via-canvas-bottom/75 to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-ink-200/45 to-transparent" />

          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div
              ref={imgRef}
              onMouseEnter={() => setHover1(true)}
              onMouseLeave={() => setHover1(false)}
              style={{
                transform: `translate3d(0, ${Math.round(
                  (0.5 - spP) * 18
                )}px, 0) scale(${(1 + spP * 0.01).toFixed(3)})`,
              }}
              className={[
                "relative lg:col-span-7",
                "will-change-transform",
                "transition-[opacity,transform,filter] duration-[1200ms] ease-out",
                imgIn
                  ? "opacity-100 translate-y-0 scale-100 blur-0"
                  : "opacity-0 translate-y-8 scale-[1.035] blur-[6px]",
              ].join(" ")}
            >
              <div
                className={[
                  "relative overflow-hidden rounded-[2.25rem]",
                  FRAME,
                  "bg-ink-50/40 shadow-[0_30px_80px_rgba(0,0,0,0.08)]",
                ].join(" ")}
              >
                <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5" />

                <div className="relative overflow-hidden rounded-[2.15rem] bg-white">
                  <img
                    src={content.spatiul.image}
                    alt="Spațiul Ateliere la Scânteia – lumină naturală, liniște, siguranță"
                    className={[
                      "h-[500px] w-full object-cover sm:h-[640px] lg:h-[760px]",
                      "object-[50%_62%] sm:object-[50%_55%] lg:object-[50%_48%]",
                      "transition-[transform,filter] duration-[900ms] ease-out",
                    ].join(" ")}
                    style={{
                      transform: `scale(${(
                        lerp(1.06, 1.11, spP) + (imgIn ? -0.02 : 0)
                      ).toFixed(3)})`,
                      filter: `grayscale(${(
                        hover1 ? 0 : lerp(0.45, 0, spP)
                      ).toFixed(3)}) saturate(${(
                        hover1 ? 1.08 : lerp(0.95, 1.1, spP)
                      ).toFixed(3)})`,
                    }}
                    loading="lazy"
                    draggable="false"
                  />
                </div>

                <div className="absolute bottom-7 left-7 right-7 sm:right-auto sm:w-[460px]">
                  <div
                    className={[
                      MINI_CARD_BASE,
                      spQuoteOn
                        ? "opacity-100 translate-y-0 blur-0"
                        : "opacity-0 translate-y-3 blur-[2px]",
                    ].join(" ")}
                    style={{ transitionDelay: spQuoteOn ? "120ms" : "0ms" }}
                  >
                    <div className="p-5">
                      <p className={MINI_TEXT}>{content.spatiul.quote}</p>
                      <div className="mt-4 h-[1px] w-12 bg-accent-600/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={textRef}
              className={[
                "lg:col-span-5",
                "will-change-transform",
                "transition-[opacity,transform] duration-[1050ms] ease-out",
                textIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              ].join(" ")}
            >
              <p className="mb-4 text-xs tracking-wideplus text-accent-600">
                {content.spatiul.label}
              </p>

              <h2 className="text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
                {content.spatiul.title}
              </h2>

              {!!content.spatiul.seoBlurbLines.length && (
                <ReadableLines
                  lines={content.spatiul.seoBlurbLines}
                  variant="seo"
                />
              )}

              <ReadableLines lines={content.spatiul.paragraphLines} variant="body" />

              <div className="mt-10 grid grid-cols-3 gap-6">
                {content.spatiul.stats.map((s, i) => (
                  <div key={i}>
                    <div className="text-3xl font-semibold text-ink-900">
                      {s.value}
                    </div>

                    <div className="mt-1 text-[11px] tracking-[0.22em] text-ink-500">
                      {s.label}
                    </div>

                    {!!s.sublabel && (
                      <div className="mt-2 max-w-[18ch] text-[12px] leading-snug text-ink-600">
                        {s.sublabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10 h-[1px] w-20 bg-ink-300/70" />

              {!!content.spatiul.hiddenKeywordsRaw && (
                <p className="sr-only">{content.spatiul.hiddenKeywordsRaw}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-b from-transparent via-ink-50/35 to-ink-50" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-b from-transparent via-ink-50/30 to-ink-10 blur-3xl" />
      </section>

      <div className="h-0 bg-ink-50 sm:h-2" />

      <section
        id="filosofie"
        ref={filoWrapRef}
        className="relative bg-ink-50 pt-10 pb-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div
              ref={filoImgRef}
              onMouseEnter={() => setHover2(true)}
              onMouseLeave={() => setHover2(false)}
              style={{
                transform: `translate3d(0, ${Math.round(
                  (0.5 - filoP) * 18
                )}px, 0) scale(${(1 + filoP * 0.01).toFixed(3)})`,
              }}
              className={[
                "lg:col-span-7 lg:order-2",
                "will-change-transform",
                "transition-[opacity,transform,filter] duration-[1200ms] ease-out",
                filoImgIn
                  ? "opacity-100 translate-y-0 scale-100 blur-0"
                  : "opacity-0 translate-y-8 scale-[1.035] blur-[6px]",
              ].join(" ")}
            >
              <div
                className={[
                  "relative overflow-hidden rounded-[2.25rem]",
                  FRAME,
                  "bg-ink-50/40 shadow-[0_30px_80px_rgba(0,0,0,0.08)]",
                ].join(" ")}
              >
                <div className="relative overflow-hidden rounded-[2.15rem] bg-white">
                  <img
                    src={content.filosofie.image}
                    alt="Filosofia Ateliere la Scânteia"
                    className={[
                      "h-[520px] w-full object-cover sm:h-[660px] lg:h-[780px]",
                      "object-[50%_55%] sm:object-[50%_50%] lg:object-[58%_48%]",
                      "transition-[transform,filter] duration-[900ms] ease-out",
                    ].join(" ")}
                    style={{
                      transform: `scale(${(
                        lerp(1.06, 1.11, filoP) + (filoImgIn ? -0.02 : 0)
                      ).toFixed(3)})`,
                      filter: `grayscale(${(
                        hover2 ? 0 : lerp(0.45, 0, filoP)
                      ).toFixed(3)}) saturate(${(
                        hover2 ? 1.08 : lerp(0.95, 1.1, filoP)
                      ).toFixed(3)})`,
                    }}
                    loading="lazy"
                    draggable="false"
                  />
                </div>

                <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-[420px]">
                  <div
                    className={[
                      MINI_CARD_BASE,
                      fiQuoteOn
                        ? "opacity-100 translate-y-0 blur-0"
                        : "opacity-0 translate-y-3 blur-[2px]",
                    ].join(" ")}
                    style={{ transitionDelay: fiQuoteOn ? "140ms" : "0ms" }}
                  >
                    <div className="p-6">
                      <p className={MINI_TEXT}>{content.filosofie.quote}</p>
                      <div className="mt-4 h-[1px] w-14 bg-accent-600/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={filoTextRef}
              className={[
                "lg:col-span-5 lg:order-1",
                "will-change-transform",
                "transition-[opacity,transform] duration-[1050ms] ease-out",
                filoTextIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              ].join(" ")}
            >
              <p className="mb-4 text-xs tracking-wideplus text-accent-600">
                {content.filosofie.label}
              </p>

              <h2 className="text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
                {content.filosofie.title1}
                {content.filosofie.title2 ? (
                  <>
                    <br />
                    <span className="italic">{content.filosofie.title2}</span>
                  </>
                ) : null}
              </h2>

              {/* ✅ ONE container (like SPAȚIUL) holding all Filosofie text */}
              <ReadableBlocks
                blocks={[
                  { lines: content.filosofie.introLines, leadBoldFirst: false },
                  { lines: content.filosofie.p1Lines, leadBoldFirst: false },
                  { lines: content.filosofie.p2Lines, leadBoldFirst: false },
                ]}
              />

              <div className="mt-10 flex items-center gap-4">
                <button
                  type="button"
                  onClick={goToMembrie}
                  className={[
                    "group relative inline-flex items-center gap-4",
                    "text-xs tracking-[0.22em]",
                    "text-ink-700 hover:text-ink-900 transition-colors",
                  ].join(" ")}
                  aria-label={content.filosofie.cta}
                >
                  <span className="pointer-events-none absolute -inset-x-3 -inset-y-2 -z-10 rounded-xl bg-accent-600/0 blur-md transition-all duration-300 group-hover:bg-accent-600/15" />
                  <span>{content.filosofie.cta}</span>
                  <span className="h-[1px] w-16 bg-accent-600/70 transition-all duration-300 group-hover:w-20 group-hover:bg-accent-600" />
                  <span className="text-ink-500 transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>

              <div
                className={[
                  "mt-12 h-[1px] w-24 bg-ink-300/60",
                  "transition-all duration-[1000ms] ease-out",
                  filoIn ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}