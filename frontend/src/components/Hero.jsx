// Hero.jsx
// NOTE: Bottom fade uses layered gradient + subtle blur for cinematic transition
import { useEffect, useMemo, useRef, useState } from "react";
import heroImg from "../assets/hero.jpeg";

function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const base = (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function splitLines(text) {
  if (!text) return [];

  const raw = String(text).trim();
  if (!raw) return [];

  const byNewline = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (byNewline.length > 1) return byNewline;

  const bySentence = raw
    .split(/(?<=[.!?])\s*(?=[A-ZĂÂÎȘȚ])/u)
    .map((s) => s.trim())
    .filter(Boolean);

  return bySentence.length > 1 ? bySentence : byNewline;
}

function getViewportSize() {
  const vv = window.visualViewport;
  const w = Math.round(vv?.width || window.innerWidth || 0);
  const h = Math.round(vv?.height || window.innerHeight || 0);
  return { w, h };
}

export default function Hero({ scrollEl }) {
  const sectionRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const [introOn, setIntroOn] = useState(true);
  const [textOn, setTextOn] = useState(false);

  const [cmsHero, setCmsHero] = useState(null);

  const initialSize = useMemo(() => {
    if (typeof window === "undefined") return { w: 0, h: 0 };
    return getViewportSize();
  }, []);

  const [lockedHeight, setLockedHeight] = useState(() =>
    typeof window === "undefined" ? null : initialSize.h
  );
  const lockedWidthRef = useRef(initialSize.w);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let t = null;

    const maybeUpdate = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const { w, h } = getViewportSize();
        if (Math.abs(w - lockedWidthRef.current) >= 2) {
          lockedWidthRef.current = w;
          setLockedHeight(h);
        }
      }, 120);
    };

    const onOrientation = () => {
      const { w, h } = getViewportSize();
      lockedWidthRef.current = w;
      setLockedHeight(h);
    };

    window.addEventListener("resize", maybeUpdate);
    window.addEventListener("orientationchange", onOrientation);
    window.visualViewport?.addEventListener("resize", maybeUpdate);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", maybeUpdate);
      window.removeEventListener("orientationchange", onOrientation);
      window.visualViewport?.removeEventListener("resize", maybeUpdate);
    };
  }, []);

  const findScrollParent = (node) => {
    let el = node?.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      const isScrollableY =
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight;
      const isScrollableX =
        (overflowX === "auto" || overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth;

      if (isScrollableY || isScrollableX) return el;
      el = el.parentElement;
    }
    return null;
  };

  useEffect(() => {
    const controller = new AbortController();
    const url = "/api/mainpage/";

    fetch(url, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok)
          throw new Error(`Failed to load mainpage content: ${r.status}`);
        return data;
      })
      .then((data) => {
        if (data?.hero) setCmsHero(data.hero);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.warn("[Hero] Headless fetch failed, using fallbacks:", err);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const scrollTarget =
      scrollEl?.current || findScrollParent(sectionRef.current) || window;

    const readScrollTop = () => {
      if (scrollTarget === window) return window.scrollY || 0;
      return scrollTarget.scrollTop || 0;
    };

    const onScroll = () => setScrollY(readScrollTop());

    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    onScroll();

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      const t0 = setTimeout(() => {
        setIntroOn(false);
        setTextOn(true);
      }, 0);

      return () => {
        clearTimeout(t0);
        scrollTarget.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }

    const t1 = setTimeout(() => setIntroOn(false), 60);
    const t2 = setTimeout(() => setTextOn(true), 260);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      scrollTarget.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollEl]);

  const effects = useMemo(() => {
    const maxScroll = 1100;
    const progress = Math.min(scrollY / maxScroll, 1);

    const baseScale = 1.26;
    const baseBlur = 0;

    const scrollScaleDown = progress * 0.34;
    const scrollBlurUp = progress * 18;
    const translateY = progress * 46;

    const introScaleExtra = introOn ? 0.22 : 0;
    const introBlurExtra = introOn ? 14 : 0;

    const introOverlayExtra = introOn ? 0.06 : 0;
    const overlayOpacity = 0.56 + progress * 0.16 + introOverlayExtra;
    const textOpacity = 1 - progress * 0.16;

    return {
      scale: baseScale + introScaleExtra - scrollScaleDown,
      blur: baseBlur + introBlurExtra + scrollBlurUp,
      translateY,
      overlayOpacity: Math.min(overlayOpacity, 0.86),
      textOpacity: Math.max(textOpacity, 0.78),
    };
  }, [scrollY, introOn]);

  const fallbackKicker = "CASA PRESEI LIBERE · BUCUREȘTI";
  const fallbackTitleLines = ["Arta cere spațiu.", "Și istorie."];
  const fallbackSubtitleLines = [
    "O enclavă de creație vizuală, unde copiii gândesc liber,",
    "iar spațiul devine mentor.",
  ];

  const cmsTitleLines = splitLines(cmsHero?.title);
  const cmsSubtitleLines = splitLines(cmsHero?.subtitle);
  const kickerText = (cmsHero?.kicker || "").trim() || fallbackKicker;

  const titleLines = cmsTitleLines.length ? cmsTitleLines : fallbackTitleLines;
  const subtitleLines = cmsSubtitleLines.length
    ? cmsSubtitleLines
    : fallbackSubtitleLines;

  const cmsBg = resolveMediaUrl(cmsHero?.bg_image);
  const bgSrc = cmsBg || heroImg;

  const sectionStyle =
    lockedHeight != null ? { height: `${lockedHeight}px` } : undefined;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden -mb-10 sm:-mb-14 md:-mb-16"
      style={sectionStyle}
    >
      {/* ✅ SEO text: present in DOM, accessible, not visually cluttering hero */}
      <div className="sr-only">
        <h1>Ateliere de Creație pentru Copii la Casa Presei</h1>
        <h2>Cursuri de Pictură și Desen în București, Sector 1</h2>
        <h3>Activități creative de weekend pentru copii</h3>
        <p>
          Ateliere la Scânteia Casa Presei. Hub creativ copii București. Educație
          prin artă sector 1. Ateliere de creație Casa Presei Libere. Dezvoltare
          personală prin desen. Activități extrașcolare Nord București. Cursuri
          pictură copii București. Atelier de pictură pentru copii. Ateliere de
          weekend pentru copii. Școală de pictură pentru copii sector 1. Ateliere
          artă lângă Herăstrău. Activități copii Piața Presei. Cursuri creative
          în sector 1.
        </p>
        <p>Piața Presei Libere Nr. 1, București, Sector 1, România.</p>
      </div>

      {/* background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform transition-transform duration-[1100ms] ease-out"
          style={{
            transform: `translate3d(0, ${effects.translateY}px, 0) scale(${effects.scale})`,
          }}
        >
          <img
            src={bgSrc}
            alt="Ateliere la Scânteia – spațiu creativ"
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable="false"
            loading="eager"
            decoding="async"
          />

          <div
            className="absolute inset-0 transform-gpu transition-[filter,opacity,transform] duration-[1100ms] ease-out"
            style={{
              filter: `blur(${effects.blur}px)`,
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 54%, rgba(0,0,0,0.92) 66%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.22) 96%, rgba(0,0,0,0.12) 102%, rgba(0,0,0,0) 112%)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 54%, rgba(0,0,0,0.92) 66%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.22) 96%, rgba(0,0,0,0.12) 102%, rgba(0,0,0,0) 112%)",
              transform: "translateY(2px) scale(1.02)",
              transformOrigin: "center",
            }}
          >
            <img
              src={bgSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center"
              draggable="false"
              loading="eager"
              decoding="async"
            />
          </div>

          <div
            className="absolute inset-0 transform-gpu transition-[filter,opacity,transform] duration-[1100ms] ease-out"
            style={{
              filter: `blur(${Math.max(2, effects.blur * 0.35)}px)`,
              opacity: 0.75,
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0.24) 72%, rgba(0,0,0,0.42) 84%, rgba(0,0,0,0.58) 94%, rgba(0,0,0,0.72) 102%, rgba(0,0,0,0.86) 112%)",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.10) 58%, rgba(0,0,0,0.24) 72%, rgba(0,0,0,0.42) 84%, rgba(0,0,0,0.58) 94%, rgba(0,0,0,0.72) 102%, rgba(0,0,0,0.86) 112%)",
              transform: "translateY(2px) scale(1.02)",
              transformOrigin: "center",
            }}
          >
            <img
              src={bgSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center"
              draggable="false"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* overlays */}
      <div
        className="pointer-events-none absolute inset-0 bg-canvas-top transition-opacity duration-[900ms] ease-out"
        style={{ opacity: effects.overlayOpacity }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/20" />

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-canvas-bottom via-canvas-bottom/90 to-transparent backdrop-blur-xl"
        style={{
          WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.78) 62%, rgba(0,0,0,0.46) 78%, rgba(0,0,0,0.22) 90%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.78) 62%, rgba(0,0,0,0.46) 78%, rgba(0,0,0,0.22) 90%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* content */}
      <div className="relative z-10 flex h-full items-center justify-center px-5 sm:px-6">
        <div
          className="max-w-4xl text-center transition-opacity duration-300"
          style={{ opacity: effects.textOpacity }}
        >
          <p
            className={[
              // ✅ Subtitluri / meniu: Plus Jakarta Sans
              "mb-4 font-jakarta font-medium text-[12px] sm:text-sm tracking-wideplus text-ink-600",
              "transition-all duration-700 ease-out",
              textOn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            ].join(" ")}
          >
            {kickerText}
          </p>

          {/* ✅ Only ONE visible H1 in hero, clean */}
          <h1
            className={[
              // ✅ Titlu principal: Fraunces 900 (Black)
              "font-fraunces font-black text-[34px] sm:text-5xl md:text-7xl leading-[1.08] sm:leading-tight text-ink-900",
              "transition-all duration-[900ms] ease-out",
              textOn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            ].join(" ")}
            style={{
              transitionDelay: textOn ? "80ms" : "0ms",
              wordBreak: "break-word",
            }}
          >
            {titleLines.map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p
            className={[
              "relative mx-auto mt-7 sm:mt-8 max-w-2xl",
              // ✅ Subtitlu: Plus Jakarta Sans
              "font-jakarta text-[15px] sm:text-[17px] italic leading-relaxed tracking-[0.035em] sm:tracking-[0.04em]",
              "text-ink-800",
              "transition-all duration-[900ms] ease-out",
              textOn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            ].join(" ")}
            style={{ transitionDelay: textOn ? "180ms" : "0ms" }}
          >
            <span className="pointer-events-none absolute -inset-x-6 -inset-y-4 -z-10 rounded-2xl bg-white/70 blur-xl" />
            {subtitleLines.map((line, idx) => (
              <span key={idx} className={idx === 0 ? "block" : "mt-1 block"}>
                {line}
              </span>
            ))}
            <span className="mx-auto mt-6 block h-[1px] w-16 bg-ink-300/60" />
          </p>

          <div
            className={[
              "mt-9 sm:mt-10 flex justify-center",
              "transition-all duration-[900ms] ease-out",
              textOn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            ].join(" ")}
            style={{ transitionDelay: textOn ? "320ms" : "0ms" }}
          >
            <a
              href="#membrie"
              className="group relative inline-flex whitespace-nowrap items-center justify-center overflow-hidden rounded-sm bg-accent-600 px-7 py-2.5 sm:px-10 sm:py-3 text-[12px] sm:text-sm font-jakarta font-bold uppercase tracking-cta text-white shadow-soft transition-all duration-500 ease-out hover:scale-[1.07] hover:shadow-[0_25px_70px_rgba(127,29,29,0.55)] active:scale-[1.03]"
            >
              <span className="pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),rgba(127,29,29,0)_65%)] transition-opacity duration-300 group-hover:opacity-100 group-hover:animate-pulse" />
              <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 translate-x-0 transition-[opacity,transform] duration-700 ease-out group-hover:opacity-100 group-hover:translate-x-[220%]" />
              <span className="absolute inset-0 translate-y-full bg-accent-700 transition-transform duration-500 ease-out group-hover:translate-y-0" />

              <span className="relative z-10 flex items-center gap-2 sm:gap-3 whitespace-nowrap transition-all duration-500 sm:group-hover:tracking-[0.12em]">
                Începe procesul de selecție
                <span className="transition-transform duration-500 group-hover:translate-x-2">
                  →
                </span>
              </span>
            </a>
          </div>

          <div
            className={[
              "mt-12 sm:mt-14 flex justify-center",
              "transition-opacity duration-700 ease-out",
              textOn ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ transitionDelay: textOn ? "520ms" : "0ms" }}
          >
            <div className="flex items-center gap-2 font-jakarta font-medium text-[11px] sm:text-xs tracking-[0.17em] sm:tracking-[0.18em] text-ink-600">
              <span className="h-[1px] w-10 bg-ink-400/60" />
              DERULEAZĂ
              <span className="h-[1px] w-10 bg-ink-400/60" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}