// Jurnal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import jurnal1 from "../assets/jurnal1.jpeg";
import jurnal2 from "../assets/jurnal2.jpeg";
import jurnal3 from "../assets/jurnal3.jpeg";

// NEW: extra images for carousels (as requested)
const jurnalSpatiulMentor2 = "/assets/jurnal-spatiul-mentor.jpeg";
const jurnalProfesorArte2 = "/assets/jurnal-profesor-arte.jpeg";


/**
 * Jurnal – editorial grid + separate page per article (SEO friendly).
 * Routes expected:
 *  - /jurnal (grid)
 *  - /jurnal/:slug (article page)
 *
 * Headless (Wagtail):
 *  - GET /api/jurnal/
 *  - GET /api/jurnal/:slug/
 *
 * Images support:
 *  - list items can provide: image (string) and/or images (array of strings)
 *  - detail can provide: image (string) and/or images (array of strings)
 *
 * Video embeds:
 *  - list items can provide: video (string) and/or videos (array of strings)
 *  - detail can provide: video (string) and/or videos (array of strings)
 *
 * NOTE:
 *  - The big hero inside the article stays IMAGES ONLY.
 *  - If an article has videos, the small cards (homepage + all articles) show ONLY video (no images).
 *  - Inside the article page, videos are shown as a BIG separate card above the "ÎNSCRIE-TE" card.
 */

// -------------------------
// API helpers (fix production vs local)
// -------------------------
const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

// -------------------------
// Helpers
// -------------------------
function resolveMediaUrl(url) {
  if (!url) return null;

  // absolute URLs stay untouched
  if (/^https?:\/\//i.test(url)) return url;

  const u = String(url);

  // ✅ Vite assets (local images from src/assets)
  if (u.startsWith("/assets/")) {
    const front = (import.meta?.env?.VITE_FRONTEND_ORIGIN || "").replace(
      /\/$/,
      ""
    );
    return front ? `${front}${u}` : u;
  }

  // ✅ Django media
  if (u.startsWith("/media/")) {
    const api = (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
    return api ? `${api}${u}` : u;
  }

  return u;
}

function mediaDedupeKey(resolvedUrl) {
  if (!resolvedUrl) return "";

  const s = String(resolvedUrl).trim();

  // remove query/hash
  const noQ = s.split("#")[0].split("?")[0];

  // take only filename
  const parts = noQ.split("/");
  const filename = (parts[parts.length - 1] || "").trim();
  if (!filename) return noQ.replace(/\/$/, "");

  // strip vite hash: name-<hash>.ext  => name.ext
  // (hash usually 6+ chars, alnum)
  const m = filename.match(/^(.+?)-[a-z0-9]{6,}(\.[a-z0-9]+)$/i);
  const normalizedFilename = m ? `${m[1]}${m[2]}` : filename;

  // key based on normalized filename (most stable), fallback to full path
  return normalizedFilename.toLowerCase();
}

function dedupeByResolvedUrl(urls) {
  const out = [];
  const seen = new Set();

  (Array.isArray(urls) ? urls : []).forEach((u) => {
    const resolved = resolveMediaUrl(u);
    if (!resolved) return;

    const key = mediaDedupeKey(resolved);
    if (key && seen.has(key)) return;

    seen.add(key || String(resolved).trim().replace(/\/$/, ""));
    out.push(resolved);
  });

  return out;
}


function normalizeImages(inputImages, fallbackSingle) {
  const arr = Array.isArray(inputImages) ? inputImages : [];

  const normalized = dedupeByResolvedUrl(
    arr.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
  );

  const single =
    typeof fallbackSingle === "string" && fallbackSingle
      ? resolveMediaUrl(fallbackSingle)
      : null;

  if (normalized.length) return normalized;
  if (single) return [single];
  return [];
}

function safeStringList(input) {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

function dedupeStrings(list) {
  const out = [];
  const seen = new Set();
  (Array.isArray(list) ? list : []).forEach((x) => {
    const v = typeof x === "string" ? x.trim() : "";
    if (!v) return;
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
  });
  return out;
}

function parseYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = (u.hostname || "").replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function parseVimeoId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = (u.hostname || "").replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    const parts = u.pathname.split("/").filter(Boolean);
    const videoIdx = parts.indexOf("video");
    const id = videoIdx >= 0 ? parts[videoIdx + 1] : parts[0];
    return id && /^[0-9]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function isVideoFileUrl(url) {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".ogg") ||
    lower.includes("video/")
  );
}

function normalizeVideoItems(videosInput) {
  const rawList = dedupeStrings(safeStringList(videosInput));
  const items = [];

  rawList.forEach((raw) => {
    const url = resolveMediaUrl(raw) || raw;

    const yt = parseYouTubeId(url);
    if (yt) {
      const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
        yt
      )}?rel=0&modestbranding=1&playsinline=1`;
      items.push({ type: "youtube", id: yt, embedSrc, original: url });
      return;
    }

    const vm = parseVimeoId(url);
    if (vm) {
      const embedSrc = `https://player.vimeo.com/video/${encodeURIComponent(
        vm
      )}?title=0&byline=0&portrait=0`;
      items.push({ type: "vimeo", id: vm, embedSrc, original: url });
      return;
    }

    if (isVideoFileUrl(url)) {
      items.push({ type: "file", src: url, original: url });
      return;
    }
  });

  return items;
}

function normalizeCardMediaItems(imagesInput, singleImage, videosInput) {
  // ✅ Requirement: if there is video attached, show ONLY video on cards.
  // ✅ IMPORTANT: [] is truthy, so always check length, not existence.
  const videos = normalizeVideoItems(videosInput);
  if (videos.length) return videos;

  const images = normalizeImages(imagesInput, singleImage);
  return images.map((src) => ({ type: "image", src }));
}

// Inject requested 2nd images by slug (works even if API provides only one image)
function withExtraImagesBySlug(article) {
  if (!article) return article;

  const slug = typeof article.slug === "string" ? article.slug : "";
  const baseImages = normalizeImages(article?.images, article?.image);
  const list = baseImages.slice();

  const toKey = (u) => String(resolveMediaUrl(u) || "").trim().replace(/\/$/, "");

  const addIfMissing = (img) => {
    const resolved = resolveMediaUrl(img);
    if (!resolved) return;

    // compare by normalized key, not by raw string
    const key = toKey(resolved);
    const existingKeys = new Set(list.map((x) => toKey(x)));
    if (existingKeys.has(key)) return;

    list.push(resolved);
  };

  if (slug === "spatiul-ca-mentor") {
    addIfMissing(jurnalSpatiulMentor2);
  } else if (slug === "greseala-cel-mai-bun-profesor") {
    addIfMissing(jurnalProfesorArte2);
  }

  // ✅ FINAL DEDUPE (fix: “îmi arată 3 imagini dar am doar 2”)
  const finalImages = dedupeByResolvedUrl(list.length ? list : baseImages);

  return {
    ...article,
    images: finalImages,
    image: finalImages?.[0] || article?.image || null,
  };
}

// -------------------------
// Local fallbacks (used if API is empty/unavailable)
// -------------------------
const FALLBACK_ARTICLES = [
  {
    slug: "spatiul-ca-mentor",
    category: "SPAȚIU",
    title: "Spațiul ca mentor: cum arhitectura influențează creativitatea",
    image: jurnal3,
    images: [jurnal3, jurnalSpatiulMentor2],
    videos: [],
    excerpt:
      "Lumina, liniștea și proporțiile nu sunt decor. Sunt condiții care modelează atenția.",
    body: [
      "Un spațiu coerent invită la lucru profund. Lumina bună reduce graba. Ordinea reduce anxietatea. Aerul și distanțele dau curaj.",
      "Când copilul intră într-un loc care respectă actul artistic, își schimbă postura: devine mai atent, mai prezent.",
      "Într-un atelier, arhitectura devine un cadru moral: aici avem voie să încercăm, să repetăm și să tăcem.",
    ],
    meta: "7 min · Observație",
  },
  {
    slug: "materialele-conteaza",
    category: "MATERIALE",
    title:
      "Materialele contează: de la tempera de supermarket la pigment profesionist",
    image: jurnal2,
    images: [jurnal2],
    videos: ["https://www.youtube.com/watch?v=IYd1-cPwQCk&t=1s"],
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
    slug: "greseala-cel-mai-bun-profesor",
    category: "FILOSOFIE",
    title: "De ce „greșeala” este cel mai bun profesor de artă",
    image: jurnal1,
    images: [jurnal1, jurnalProfesorArte2],
    videos: [],
    excerpt:
      "În atelier, greșeala nu e eșec. E material brut pentru observație, curaj și limbaj vizual.",
    body: [
      "În educația estetică, greșeala e un instrument – nu o rușine. Când copilul înțelege că o linie „ratată” poate deveni o idee nouă, se naște libertatea de a explora.",
      "În loc de corecturi rapide, lucrăm cu întrebări: Ce se întâmplă dacă? Cum se schimbă compoziția dacă mutăm centrul de greutate? Ce poveste spune pata?",
      "Așa apar ritmul, intenția și disciplina blândă: nu pentru note, ci pentru un limbaj personal care crește în timp.",
    ],
    meta: "6 min · Atelier",
  },
];

function normalizeListPayload(json) {
  const items = Array.isArray(json?.items) ? json.items : [];
  const index = json?.index || null;

  const normalizedItems = items
    .map((a) => {
      const slug = typeof a?.slug === "string" ? a.slug : "";
      const title = typeof a?.title === "string" ? a.title : "";
      const category = typeof a?.category === "string" ? a.category : "";
      const excerpt = typeof a?.excerpt === "string" ? a.excerpt : "";
      const meta = typeof a?.meta === "string" ? a.meta : "";

      const images = normalizeImages(a?.images, a?.image);
      const videos = dedupeStrings(safeStringList(a?.videos ?? a?.video));

      return withExtraImagesBySlug({
        slug,
        category,
        title,
        image: images?.[0] || null,
        images,
        videos,
        excerpt,
        meta,
      });
    })
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

// -------------------------
// Carousel (smooth transition) — supports images OR mixed media
// -------------------------
function MediaCarousel({
  images,
  mediaItems,
  alt,
  className = "",
  imgClassName = "",
  autoplayMs = 3000,
  showArrows = true,
  showDots = false,
  pauseOnHover = true,
  initialIndex = 0,
  onIndexChange = null,
  arrowsAlways = false,
}) {
  const listFromImages = Array.isArray(images)
    ? images.filter(Boolean).map((src) => ({ type: "image", src }))
    : [];

  const list =
    Array.isArray(mediaItems) && mediaItems.length
      ? mediaItems.filter(Boolean)
      : listFromImages;

  const hasMany = list.length > 1;

  const clampIndex = (v) => {
    if (!list.length) return 0;
    return Math.max(0, Math.min(Number(v) || 0, list.length - 1));
  };

  const [idx, setIdx] = useState(() => clampIndex(initialIndex));
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState(1);

  const safeIdx = list.length ? Math.min(idx, list.length - 1) : 0;
  const safeIdxClamped = list.length ? Math.min(safeIdx, list.length - 1) : 0;

  useEffect(() => {
    const current = list[safeIdxClamped];
    const isVideo =
      current?.type === "youtube" ||
      current?.type === "vimeo" ||
      current?.type === "file";
    if (isVideo) setPaused(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdxClamped]);

  useEffect(() => {
    if (typeof onIndexChange === "function") onIndexChange(safeIdxClamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdxClamped]);

  useEffect(() => {
    if (!hasMany) return;
    if (paused) return;

    const t = window.setInterval(() => {
      setDir(1);
      setIdx((v) => (clampIndex(v) + 1) % list.length);
    }, Math.max(1200, Number(autoplayMs) || 3000));

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMany, paused, autoplayMs, list.length]);

  const prev = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hasMany) return;
    setDir(-1);
    setPaused(false);
    setIdx((v) => {
      const cur = clampIndex(v);
      return (cur - 1 + list.length) % list.length;
    });
  };

  const next = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hasMany) return;
    setDir(1);
    setPaused(false);
    setIdx((v) => {
      const cur = clampIndex(v);
      return (cur + 1) % list.length;
    });
  };

  const onKey = (e) => {
    if (!hasMany) return;
    if (e.key === "ArrowLeft") prev(e);
    if (e.key === "ArrowRight") next(e);
  };

  const onEnter = () => {
    if (!pauseOnHover) return;
    setPaused(true);
  };
  const onLeave = () => {
    if (!pauseOnHover) return;
    const current = list[safeIdxClamped];
    const isVideo =
      current?.type === "youtube" ||
      current?.type === "vimeo" ||
      current?.type === "file";
    if (isVideo) return;
    setPaused(false);
  };

  if (!list.length) return null;

  const renderSlide = (item, active) => {
    const from = dir > 0 ? "translate-x-[8px]" : "translate-x-[-8px]";
    const base = [
      "absolute inset-0 h-full w-full",
      active ? "pointer-events-auto" : "pointer-events-none", // ✅ IMPORTANT
      "transition-[opacity,transform,filter] duration-[900ms] ease-out",
      active
        ? "opacity-100 scale-[1.03] translate-x-0 blur-0"
        : `opacity-0 scale-[1.2] ${from} blur-[0.9px]`,
    ].join(" ");

    if (item?.type === "youtube" || item?.type === "vimeo") {
      return (
        <div key={`${item.embedSrc}`} className={base}>
          <div className="h-full w-full">
            <iframe
              title={alt || "Video"}
              src={item.embedSrc}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className={["h-full w-full", "rounded-none", "bg-black"].join(" ")}
              style={{ border: 0 }}
            />
          </div>
        </div>
      );
    }

    if (item?.type === "file") {
      return (
        <div key={`${item.src}`} className={base}>
          <video
            src={item.src}
            controls
            preload="metadata"
            playsInline
            className={["h-full w-full object-cover", "bg-black", imgClassName].join(
              " "
            )}
          />
        </div>
      );
    }

    return (
      <img
        key={`${item?.src}`}
        src={item?.src}
        alt={alt}
        loading="lazy"
        draggable="false"
        className={[base, "object-cover", imgClassName].join(" ")}
      />
    );
  };

  return (
    <div
      className={["relative", className].join(" ")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onKeyDown={onKey}
      tabIndex={-1}
      aria-roledescription={hasMany ? "carousel" : undefined}
    >
      <div className="relative h-full w-full overflow-hidden">
        {list.map((item, i) => {
          const active = i === safeIdxClamped;
          return renderSlide(item, active);
        })}
      </div>

      {showArrows && hasMany ? (
        <>
          <button
            type="button"
            aria-label="Imaginea anterioară"
            onClick={prev}
            className={[
              "absolute left-4 top-1/2 z-30 -translate-y-1/2 pointer-events-auto",
              "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
              "border border-white/25 bg-black/25 text-white backdrop-blur",
              "shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
              arrowsAlways
                ? "opacity-100 translate-x-0"
                : "opacity-100 translate-x-0 sm:opacity-0 sm:translate-x-1 sm:transition-all sm:duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-x-0",
              "focus:opacity-100 focus:translate-x-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            ].join(" ")}
          >
            <span aria-hidden className="text-xl leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            aria-label="Imaginea următoare"
            onClick={next}
            className={[
              "absolute right-4 top-1/2 z-30 -translate-y-1/2 pointer-events-auto",
              "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
              "border border-white/25 bg-black/25 text-white backdrop-blur",
              "shadow-[0_16px_50px_rgba(0,0,0,0.25)]",
              arrowsAlways
                ? "opacity-100 translate-x-0"
                : "opacity-100 translate-x-0 sm:opacity-0 sm:-translate-x-1 sm:transition-all sm:duration-300 sm:group-hover:opacity-100 sm:group-hover:translate-x-0",
              "focus:opacity-100 focus:translate-x-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
            ].join(" ")}
          >
            <span aria-hidden className="text-xl leading-none">
              ›
            </span>
          </button>
        </>
      ) : null}

      {showDots && hasMany ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/20 px-3 py-2 backdrop-blur">
            {list.map((_, i) => (
              <span
                key={i}
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  i === safeIdxClamped ? "bg-white" : "bg-white/40",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -------------------------
// Fullscreen modal gallery (WITH arrows + keyboard left/right)
// -------------------------
function FullscreenGallery({ open, images, startIndex = 0, alt, onClose }) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  const hasMany = list.length > 1;

  const clampIndex = (v) => {
    if (!list.length) return 0;
    return Math.max(0, Math.min(Number(v) || 0, list.length - 1));
  };

  const [idx, setIdx] = useState(() => clampIndex(startIndex));

  useEffect(() => {
    if (!open) return;
    setIdx(clampIndex(startIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startIndex, list.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (!hasMany) return;
      if (e.key === "ArrowLeft")
        setIdx((v) => (clampIndex(v) - 1 + list.length) % list.length);
      if (e.key === "ArrowRight")
        setIdx((v) => (clampIndex(v) + 1) % list.length);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasMany, list.length, onClose]);

  if (!open) return null;

  const prevImg = (e) => {
    if (e) e.stopPropagation();
    if (!hasMany) return;
    setIdx((v) => (clampIndex(v) - 1 + list.length) % list.length);
  };

  const nextImg = (e) => {
    if (e) e.stopPropagation();
    if (!hasMany) return;
    setIdx((v) => (clampIndex(v) + 1) % list.length);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Închide"
        onClick={onClose}
        className="absolute inset-0 bg-black/80"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          className={[
            "relative w-full max-w-6xl overflow-hidden rounded-[1.75rem]",
            "border border-white/10 bg-black/30 shadow-[0_60px_180px_rgba(0,0,0,0.55)] backdrop-blur",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-[12px] tracking-[0.22em] text-white/75">
                IMAGINE {hasMany ? `${idx + 1}/${list.length}` : ""}
              </p>
              <p className="truncate text-[13px] text-white/90">{alt}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-[11px] tracking-[0.26em] text-white/90 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              ÎNCHIDE ✕
            </button>
          </div>

          <div className="relative h-[72vh] w-full sm:h-[78vh]">
            <MediaCarousel
              key={`fs-${list.length}`}
              images={list.length ? list : []}
              alt={alt}
              autoplayMs={999999}
              showArrows={true}
              showDots={hasMany}
              pauseOnHover={false}
              initialIndex={idx}
              arrowsAlways={true}
              className="h-full w-full"
              imgClassName="h-full w-full object-contain"
              onIndexChange={setIdx}
            />

            {hasMany ? (
              <>
                <button
                  type="button"
                  onClick={prevImg}
                  aria-label="Imaginea anterioară"
                  className="absolute left-0 top-0 h-full w-[18%] cursor-w-resize"
                  style={{ background: "transparent" }}
                />
                <button
                  type="button"
                  onClick={nextImg}
                  aria-label="Imaginea următoare"
                  className="absolute right-0 top-0 h-full w-[18%] cursor-e-resize"
                  style={{ background: "transparent" }}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// BIG video card (article page)
// -------------------------
function ArticleVideoCard({ videos, title = "Video" }) {
  const mediaItems = useMemo(() => normalizeVideoItems(videos), [videos]);

  if (!mediaItems.length) return null;

  return (
    <section
      className={[
        "overflow-hidden rounded-[2.25rem] border border-ink-200/70 bg-white/55",
        "shadow-[0_30px_90px_rgba(0,0,0,0.10)] backdrop-blur-[2px]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4 border-b border-ink-200/70 px-6 py-5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.26em] text-ink-500">MEDIA</p>
          <p className="mt-1 truncate text-[14px] font-medium text-ink-900">
            {title}
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200/70 bg-white/60 px-4 py-2 text-[11px] tracking-[0.22em] text-ink-700">
          {mediaItems.length > 1 ? `${mediaItems.length} CLIPURI` : "1 CLIP"}
        </div>
      </div>

      <div className="relative">
        <MediaCarousel
          mediaItems={mediaItems}
          alt={title}
          autoplayMs={999999}
          showArrows={mediaItems.length > 1}
          showDots={mediaItems.length > 1}
          pauseOnHover={true}
          className="aspect-video w-full"
          imgClassName="h-full w-full object-cover"
          arrowsAlways={true}
        />
      </div>

      <div className="px-6 py-5">
        <p className="text-[13px] leading-relaxed text-ink-600">
          Dacă ai întrebări sau vrei să vezi un fragment din atmosferă / proces,
          clipul de mai sus îți oferă context rapid.
        </p>
      </div>
    </section>
  );
}

export default function Jurnal() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(apiUrl("/api/jurnal/"), { signal: controller.signal })
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

  const articles =
    cms?.items && cms.items.length ? cms.items : FALLBACK_ARTICLES;

  const patchedArticles = useMemo(
    () => articles.map((a) => withExtraImagesBySlug(a)),
    [articles]
  );

  const visibleArticles = useMemo(
    () => patchedArticles.slice(0, 3),
    [patchedArticles]
  );

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

    fetch(apiUrl("/api/jurnal/"), { signal: controller.signal })
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
  const articles =
    cms?.items && cms.items.length ? cms.items : FALLBACK_ARTICLES;

  const patchedArticles = useMemo(
    () => articles.map((a) => withExtraImagesBySlug(a)),
    [articles]
  );

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
          {patchedArticles.map((a) => (
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

  const patched = withExtraImagesBySlug(a);

  // Cards must show ONLY video if it exists; otherwise images.
  const cardMedia = normalizeCardMediaItems(
    patched?.images,
    patched?.image || jurnal1,
    patched?.videos ?? patched?.video
  );

  const safeCardMedia = cardMedia.length
    ? cardMedia
    : [{ type: "image", src: jurnal1 }];

  const hasAnyVideoOnCard = safeCardMedia.some((x) => x?.type !== "image");
  const allImagesOnCard = safeCardMedia.every((x) => x?.type === "image");

  return (
    <Link
      ref={cardRef}
      to={to}
      aria-label={patched.title}
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
          <MediaCarousel
            mediaItems={safeCardMedia}
            alt={patched.title}
            autoplayMs={hasAnyVideoOnCard ? 999999 : 5000}
            showArrows={safeCardMedia.length > 1}
            showDots={false}
            className="h-[360px] w-full sm:h-[420px]"
            imgClassName={[
              "h-full w-full",
              "transition-transform duration-[900ms] ease-out",
              // only zoom images, not videos
              allImagesOnCard ? "group-hover:scale-[1.12]" : "",
            ].join(" ")}
            arrowsAlways={true}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(240px circle at var(--mx) var(--my), rgba(185,28,28,0.26), rgba(185,28,28,0.14) 35%, rgba(185,28,28,0.07) 55%, transparent 72%)",
            }}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        </div>

        <div className="relative z-20 px-7 pb-8 pt-6">
          <p className="text-[11px] tracking-[0.26em] text-ink-500">
            {patched.meta}
          </p>

          <h3 className="mt-3 text-[28px] font-semibold leading-[1.08] text-ink-900">
            {patched.title}
          </h3>

          <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-ink-700">
            {patched.excerpt}
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
  const baseClass = [
    "mx-auto max-w-[72ch]",
    "text-[16px] leading-[1.95] text-ink-800/90 sm:text-[18px]",
    "[&_p+_p]:mt-6",
    "[&_.dropcap:first-letter]:float-left [&_.dropcap:first-letter]:mr-3 [&_.dropcap:first-letter]:mt-1",
    "[&_.dropcap:first-letter]:text-5xl [&_.dropcap:first-letter]:font-semibold [&_.dropcap:first-letter]:leading-none [&_.dropcap:first-letter]:text-ink-900",
  ].join(" ");

  if (typeof a?.body_html === "string" && a.body_html.trim()) {
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
        {a.body.map((p, idx2) => (
          <p key={idx2} className={idx2 === 0 ? "dropcap" : ""}>
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

  // IMPORTANT: hooks must not be conditional — define memo at top-level
  const fallbackArticle = useMemo(
    () => FALLBACK_ARTICLES.find((x) => x.slug === slug) || null,
    [slug]
  );

  const [article, setArticle] = useState(null);
  const [status, setStatus] = useState("loading");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [headerIdx, setHeaderIdx] = useState(0);
  const [lightboxStart, setLightboxStart] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(apiUrl(`/api/jurnal/${slug}/`), { signal: controller.signal })
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

        const images = normalizeImages(d?.images, d?.image);
        const videos = dedupeStrings(safeStringList(d?.videos ?? d?.video));

        const patched = withExtraImagesBySlug({
          slug: typeof d?.slug === "string" ? d.slug : slug,
          category: typeof d?.category === "string" ? d.category : "",
          title: typeof d?.title === "string" ? d.title : "",
          image: images?.[0] || null,
          images,
          videos,
          excerpt: typeof d?.excerpt === "string" ? d.excerpt : "",
          meta: typeof d?.meta === "string" ? d.meta : "",
          body_html: typeof d?.body_html === "string" ? d.body_html : "",
        });

        setArticle(patched);
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

  if (!a) return null;

  const patchedA = withExtraImagesBySlug(a);

  // IMPORTANT: hero stays images only (as requested)
  const headerImages = normalizeImages(
    patchedA?.images,
    patchedA?.image || jurnal1
  );
  const safeHeaderImages = headerImages.length ? headerImages : [jurnal1];

  const openLightbox = () => {
    setLightboxStart(headerIdx || 0);
    setLightboxOpen(true);
  };

  const topLabel = "( ARHIVA SCÂNTEIA )";
  const topMeta = [
    (patchedA?.category || "").trim(),
    (patchedA?.meta || "").trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  // ✅ IMPORTANT: check LENGTH (not truthy of [])
  const hasVideos = dedupeStrings(safeStringList(patchedA?.videos)).length > 0;

  return (
    <article className="relative overflow-hidden bg-[#F6F1E7] pb-12 pt-24 sm:pb-16 sm:pt-28">
      <div className="mx-auto max-w-7xl px-0 sm:px-6">
        {/* TOP BAR */}
        <div className="mt-6 px-6 sm:px-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[220px]">
              <p className="text-xs tracking-[0.28em] text-accent-700">
                {topLabel}
              </p>
              {topMeta ? (
                <p className="mt-2 text-[11px] tracking-[0.26em] text-ink-500">
                  {topMeta}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/jurnal"
                className={[
                  "inline-flex items-center gap-3",
                  "rounded-full border border-accent-700/25 bg-white/70 px-6 py-3",
                  "text-xs tracking-[0.22em] text-ink-800",
                  "shadow-[0_12px_34px_rgba(0,0,0,0.07)]",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/85 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]",
                ].join(" ")}
              >
                ← VEZI TOATE ARTICOLELE
                <span className="h-px w-12 bg-ink-300/70" />
              </Link>

              <Link
                to="/#jurnal"
                className={[
                  "inline-flex items-center gap-3",
                  "rounded-full border border-accent-700/25 bg-white/70 px-6 py-3",
                  "text-xs tracking-[0.22em] text-ink-800",
                  "shadow-[0_12px_34px_rgba(0,0,0,0.07)]",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-700/45 hover:bg-white/85 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-700 focus-visible:ring-offset-4 focus-visible:ring-offset-[#F6F1E7]",
                ].join(" ")}
              >
                ← ÎNAPOI LA JURNAL
                <span className="h-px w-12 bg-ink-300/70" />
              </Link>
            </div>
          </div>
        </div>

        {/* HERO (images only) — clean slideshow header (no heavy gradient) */}
        <header className="mt-6 overflow-hidden rounded-none border-y border-ink-200/70 bg-white/60 shadow-[0_60px_160px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:mt-8 sm:rounded-[2.75rem] sm:border sm:mx-0">
          <button
            type="button"
            onClick={openLightbox}
            className="relative block w-full text-left"
            aria-label="Deschide imaginea în ecran complet"
          >
            <div className="relative h-[440px] sm:h-[680px]">
              <div className="group relative h-full w-full">
                <MediaCarousel
                  images={safeHeaderImages}
                  alt={patchedA.title}
                  autoplayMs={5000}
                  showArrows={true}
                  showDots={false}
                  className="h-full w-full"
                  imgClassName="h-full w-full"
                  onIndexChange={setHeaderIdx}
                />
              </div>

              {/* ✅ Remove heavy gradient overlay. Keep only a very subtle edge safety */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 42%, rgba(0,0,0,0.00) 100%)",
                }}
              />

              {/* Fullscreen icon */}
              <div className="pointer-events-none absolute right-5 top-5 z-30">
                <div
                  className={[
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                    "border border-white/25 bg-white/10 text-white backdrop-blur",
                    "shadow-[0_16px_55px_rgba(0,0,0,0.28)]",
                  ].join(" ")}
                  aria-hidden
                  title="Deschide fullscreen"
                >
                  <span className="text-[18px] leading-none">⌕</span>
                </div>
              </div>

              {/* ✅ Small indicator (clean) */}
              {safeHeaderImages.length > 1 ? (
                <div className="pointer-events-none absolute left-5 top-5 z-30">
                  <div className="rounded-2xl border border-white/20 bg-black/15 px-4 py-2 text-[11px] tracking-[0.22em] text-white/90 backdrop-blur">
                    {headerIdx + 1}/{safeHeaderImages.length}
                  </div>
                </div>
              ) : null}
            </div>
          </button>
        </header>

        {/* ✅ Title moved BELOW header */}
        <div className="mt-8 px-6 sm:px-0">
          <h1 className="text-4xl font-semibold leading-[1.05] text-ink-900 sm:text-6xl">
            {patchedA.title}
          </h1>

          {patchedA.excerpt ? (
            <p className="mt-5 max-w-4xl text-[15px] italic leading-relaxed text-ink-700/90 sm:text-[16px]">
              - {patchedA.excerpt}
            </p>
          ) : null}

          <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-ink-200/70 to-transparent" />
        </div>

        <FullscreenGallery
          open={lightboxOpen}
          images={safeHeaderImages}
          startIndex={lightboxStart}
          alt={patchedA.title}
          onClose={() => setLightboxOpen(false)}
        />

        {/* MOBILE */}
        <div className="mt-0 lg:hidden">
          <div className="overflow-hidden rounded-none border-y border-ink-200/70 bg-white/55 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px] sm:mt-10 sm:rounded-[2.25rem] sm:border">
            <section className="px-6 pb-10 pt-8 sm:px-10 sm:pt-10">
              <ArticleBody a={patchedA} />
              <div className="mt-10 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-ink-200/80" />
                <span className="text-[11px] italic tracking-[0.18em] text-ink-500">
                  Arhiva Scânteia
                </span>
                <span className="h-px w-10 bg-ink-200/80" />
              </div>
            </section>

            {/* BIG VIDEO CARD above CTA */}
            {hasVideos ? (
              <section className="border-t border-ink-200/70 px-6 py-8 sm:px-10">
                <ArticleVideoCard videos={patchedA?.videos} title="" />
              </section>
            ) : null}

            <section className="border-t border-ink-200/70 px-6 py-8 sm:px-10">
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

        {/* DESKTOP */}
        <div className="mt-10 hidden gap-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-12">
          <section className="rounded-[2.25rem] border border-ink-200/70 bg-white/55 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
            <ArticleBody a={patchedA} />

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
            {/* BIG VIDEO CARD above CTA (desktop) */}
            {hasVideos ? (
              <ArticleVideoCard videos={patchedA?.videos} title="" />
            ) : null}

            <div className="rounded-[2.25rem] border border-ink-200/70 bg-white/55 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
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
          </aside>
        </div>
      </div>
    </article>
  );
}
