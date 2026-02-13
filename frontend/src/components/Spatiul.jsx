import { useEffect, useMemo, useRef, useState } from "react";
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

export default function Spatiul({ scrollEl }) {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

  const [cms, setCms] = useState(null);

  const observerRoot = scrollEl?.current || null;

  const [wrapRef] = useInView({ threshold: 0.12 }, observerRoot);
  const [imgRef, imgIn] = useInView({ threshold: 0.22 }, observerRoot);
  const [textRef, textIn] = useInView({ threshold: 0.22 }, observerRoot);
  const spP = useScrollProgress(wrapRef, scrollEl);

  const [filoWrapRef, filoIn] = useInView({ threshold: 0.16 }, observerRoot);
  const [filoImgRef, filoImgIn] = useInView({ threshold: 0.2 }, observerRoot);
  const [filoTextRef, filoTextIn] = useInView(
    { threshold: 0.2 },
    observerRoot
  );
  const filoP = useScrollProgress(filoWrapRef, scrollEl);

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

    const spStats =
      Array.isArray(sp.stats) && sp.stats.length === 3
        ? sp.stats
        : [
            { value: "1956", label: "MARMURĂ" },
            { value: "4m", label: "LUMINĂ NORD" },
            { value: "∞", label: "LINIȘTE" },
          ];

    return {
      spatiul: {
        label: (sp.label || "( SPAȚIUL )").trim(),
        title: (sp.title || "Suntem într-un monument.").trim(),
        paragraphLines: splitLines(sp.paragraph).length
          ? splitLines(sp.paragraph)
          : [
              "Tavane înalte, lumină naturală de nord și o atmosferă care impune",
              "respect pentru actul artistic. Spațiul nu e decor — este mentor.",
            ],
        // ✅ NEW: fully editable from Wagtail
        seoBlurbLines: splitLines(sp.seo_blurb),
        hiddenKeywordsRaw: (sp.hidden_keywords || "").trim(),

        image: spImage,
        quote: (
          sp.quote ||
          "„Numărul strict limitat de locuri asigură că mentorul este un partener de dialog pentru fiecare copil, nu un supraveghetor.”"
        ).trim(),
        stats: spStats,
      },
      filosofie: {
        label: (fi.label || "( FILOSOFIA NOASTRĂ )").trim(),
        title1: (fi.title_line_1 || "Sanctuar Privat.").trim(),
        title2: (fi.title_line_2 || "Libertate Radicală.").trim(),
        introLines: splitLines(fi.intro).length
          ? splitLines(fi.intro)
          : [
              "Departe de agitația comercială, Ateliere la Scânteia oferă un",
              "spațiu unde timpul curge altfel.",
            ],
        p1Lines: splitLines(fi.paragraph_1).length
          ? splitLines(fi.paragraph_1)
          : [
              "Într-un cerc restrâns și securizat, copiii scapă de presiunea",
              "notelor și a performanței standardizate. Aici găsesc libertatea radicală de a crea fără frică.",
            ],
        p2Lines: splitLines(fi.paragraph_2).length
          ? splitLines(fi.paragraph_2)
          : [
              "Oferim materiale profesioniste și spațiu vital imens pentru ca",
              "cei mici să-și testeze limitele creativității într-un mediu sigur.",
            ],
        cta: (fi.cta_text || "SOLICITĂ O INVITAȚIE").trim(),
        image: fiImage,
        quote: (
          fi.quote ||
          "„Un cerc restrâns, un spațiu securizat și materiale profesioniste: aici copilul își poate testa creativitatea fără frica de greșeală, de note sau de presiunea performanței.”"
        ).trim(),
      },
    };
  }, [cms]);

  const FRAME = "border border-[#6b1f2a]"; // 1px visiniu

  const MINI_CARD = [
    "rounded-2xl",
    "bg-white/95",
    "backdrop-blur-sm",
    "shadow-[0_18px_60px_rgba(0,0,0,0.14)]",
    "ring-1 ring-black/5",
    "max-w-full overflow-hidden",
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
                    alt="Spațiul – lumină, materiale, liniște"
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
                  <div className={MINI_CARD}>
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

              {/* ✅ SEO blurb (editable in Wagtail) */}
              {!!content.spatiul.seoBlurbLines.length && (
                <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-ink-600">
                  {content.spatiul.seoBlurbLines.map((line, idx) => (
                    <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                      {line}
                    </span>
                  ))}
                </p>
              )}

              <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-ink-700">
                {content.spatiul.paragraphLines.map((line, idx) => (
                  <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                    {line}
                  </span>
                ))}
              </p>

              <div className="mt-10 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-semibold text-ink-900">
                    {content.spatiul.stats[0].value}
                  </div>
                  <div className="mt-1 text-[11px] tracking-[0.22em] text-ink-500">
                    {content.spatiul.stats[0].label}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-ink-900">
                    {content.spatiul.stats[1].value}
                  </div>
                  <div className="mt-1 text-[11px] tracking-[0.22em] text-ink-500">
                    {content.spatiul.stats[1].label}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-ink-900">
                    {content.spatiul.stats[2].value}
                  </div>
                  <div className="mt-1 text-[11px] tracking-[0.22em] text-ink-500">
                    {content.spatiul.stats[2].label}
                  </div>
                </div>
              </div>

              <div className="mt-10 h-[1px] w-20 bg-ink-300/70" />

              {/* ✅ Optional hidden keywords (editable in Wagtail) */}
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
                  <div className={MINI_CARD}>
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
                <br />
                <span className="italic">{content.filosofie.title2}</span>
              </h2>

              <p className="mt-6 text-[15px] leading-relaxed text-ink-700">
                {content.filosofie.introLines.map((line, idx) => (
                  <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                    {line}
                  </span>
                ))}
              </p>

              <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-ink-700">
                <p>
                  {content.filosofie.p1Lines.map((line, idx) => (
                    <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                      {line}
                    </span>
                  ))}
                </p>
                <p>
                  {content.filosofie.p2Lines.map((line, idx) => (
                    <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              <div className="mt-10 flex items-center gap-4">
                <button
                  type="button"
                  onClick={goToMembrie}
                  className="text-xs tracking-[0.22em] text-ink-700 hover:text-ink-900 transition-colors"
                >
                  {content.filosofie.cta}
                </button>
                <span className="h-[1px] w-16 bg-accent-600" />
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
