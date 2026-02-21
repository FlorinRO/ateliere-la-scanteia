import { useEffect, useMemo, useRef, useState } from "react";

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      const t0 = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(t0);
    }

    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return [ref, inView];
}

export default function Testimoniale() {
  const fallbackItems = useMemo(
    () => [
      {
        quote:
          "Într-o lume a dopaminei instantanee, acesta este singurul loc unde fiul meu are răbdarea să lucreze două ore la o singură linie de cărbune.",
        name: "Ana M.",
        role: "Partner @ Arhitectură & Design",
      },
      {
        quote:
          "Scara monumentală a Casei Presei îi obligă pe copii să gândească mare. Nu există «drăgălășenii» aici. Există studiu, proporție și seriozitate.",
        name: "Alexandru S.",
        role: "Tech Entrepreneur & Collector",
      },
      {
        quote:
          "Am căutat mult timp un loc care să nu fie un «parking de copii». Aici am găsit o comunitate de familii care împărtășesc aceleași valori.",
        name: "Ioana D.",
        role: "Medic & Membru Fondator",
      },
      {
        quote:
          "Copiii mei au descoperit că arta nu este despre talent înnăscut, ci despre disciplină și observație atentă. Evoluția lor este incredibilă.",
        name: "Maria T.",
        role: "Avocat & Colecționar",
      },
      {
        quote:
          "Spațiul în sine este o lecție de estetică. Fiecare dată când intrăm, copiii simt că fac parte din ceva care transcende simplul «curs de desen».",
        name: "Cristian P.",
        role: "Arhitect & Fondator Studio",
      },
    ],
    []
  );

  const scrollerRef = useRef(null);
  const [wrapRef, inView] = useInView({ threshold: 0.18 });

  const [items, setItems] = useState(null);
  const [cmsTitle, setCmsTitle] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/mainpage/", { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`Failed to load testimonials: ${r.status}`);
        return data;
      })
      .then((data) => {
        const loaded = Array.isArray(data?.testimoniale?.items)
          ? data.testimoniale.items
          : null;
        if (loaded && loaded.length) setItems(loaded);

        if (typeof data?.testimoniale?.title === "string") {
          setCmsTitle(data.testimoniale.title);
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  const itemsToRender = items && items.length ? items : fallbackItems;

  const scrollByCards = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Subtle progress for edge fades
  const [edgeP, setEdgeP] = useState({ left: 0, right: 1 });
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const max = Math.max(1, el.scrollWidth - el.clientWidth);
      const p = clamp01(el.scrollLeft / max);
      setEdgeP({ left: p, right: 1 - p });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      id="testimoniale"
      className="relative bg-ink-50 px-4 pt-6 pb-14 sm:px-6 sm:pt-24 sm:pb-24"
    >
      {/* Local scrollbar-hide (no global CSS needed) */}
      <style>{`
        .als-scroller { -ms-overflow-style: none; scrollbar-width: none; }
        .als-scroller::-webkit-scrollbar { display: none; height: 0; }
      `}</style>

      {/* Top hairline */}
      <div className="mx-auto max-w-7xl">
        <div className="h-px w-full bg-ink-200/70" />
      </div>

      <div className="mx-auto max-w-7xl pt-6 sm:pt-16">
        {/* Heading */}
        <div className="relative text-center">
          <p
            className={[
              "text-xs tracking-[0.26em] text-accent-600",
              "transition-all duration-700 ease-out",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
          >
            ( TESTIMONIALE )
          </p>

          <h2
            className={[
              "mt-5 text-4xl font-medium leading-tight sm:text-5xl",
              "transition-all duration-[900ms] ease-out",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            ].join(" ")}
            style={{ transitionDelay: inView ? "80ms" : "0ms" }}
          >
            {(cmsTitle || "Vocile Comunității").trim()}
          </h2>

          {/* ✅ Controls (even more subtle) */}
          <div
            className={[
              "mt-6 flex items-center justify-center gap-2 sm:mt-8",
              "transition-all duration-700 ease-out",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
            ].join(" ")}
            style={{ transitionDelay: inView ? "140ms" : "0ms" }}
          >
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className={[
                "group inline-flex items-center justify-center",
                "h-7 w-7 sm:h-8 sm:w-8",
                "rounded-full",
                "border border-ink-200/20",
                "bg-transparent",
                "text-ink-400/70",
                "transition-all duration-300",
                "hover:border-ink-200/40 hover:text-ink-600/80",
                "active:scale-[0.99]",
              ].join(" ")}
              aria-label="Derulează la stânga"
            >
              <span className="text-[14px] leading-none transition-transform duration-300 group-hover:-translate-x-0.5">
                ←
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className={[
                "group inline-flex items-center justify-center",
                "h-7 w-7 sm:h-8 sm:w-8",
                "rounded-full",
                "border border-ink-200/20",
                "bg-transparent",
                "text-ink-400/70",
                "transition-all duration-300",
                "hover:border-ink-200/40 hover:text-ink-600/80",
                "active:scale-[0.99]",
              ].join(" ")}
              aria-label="Derulează la dreapta"
            >
              <span className="text-[14px] leading-none transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        </div>

        {/* Horizontal scroller */}
        <div
          className={[
            "relative mt-8 sm:mt-14",
            "transition-all duration-[900ms] ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          ].join(" ")}
          style={{ transitionDelay: inView ? "220ms" : "0ms" }}
        >
          {/* Right-side blur veil (fades as you reach the end) */}
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-[58%] max-w-[560px] backdrop-blur-md md:block
  bg-[linear-gradient(to_left,rgba(250,250,250,0.98),rgba(250,250,250,0.9)_10%,rgba(250,250,250,0.65)_30%,rgba(250,250,250,0.35)_55%,rgba(250,250,250,0.12)_75%,rgba(250,250,250,0)_100%)]
  [-webkit-mask-image:linear-gradient(to_left,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_8%,rgba(0,0,0,0.9)_18%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.22)_68%,rgba(0,0,0,0)_100%)]
  [mask-image:linear-gradient(to_left,rgba(0,0,0,1)_0%,rgba(0,0,0,1)_8%,rgba(0,0,0,0.9)_18%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.22)_68%,rgba(0,0,0,0)_100%)]"
            style={{ opacity: Math.min(1, edgeP.right + 0.05) }}
          />
          {/* Left-side soft veil */}
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-16 bg-gradient-to-r from-ink-50/70 to-transparent md:block"
            style={{ opacity: Math.min(0.9, edgeP.left + 0.05) }}
          />

          <div
            ref={scrollerRef}
            className="als-scroller flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth"
          >
            {itemsToRender.map((t, idx) => (
              <article
                key={idx}
                className="group snap-start"
                style={{ minWidth: "min(520px, 86vw)" }}
              >
                <div className="relative h-full rounded-3xl border border-ink-200/35 bg-transparent p-10 shadow-none transition-all duration-500 will-change-transform hover:-translate-y-1 hover:border-accent-600/25 hover:bg-white/45 hover:shadow-soft">
                  <p className="font-serif italic text-[1.22rem] leading-[1.9] text-ink-800 md:text-[1.28rem]">
                    {t.quote}
                  </p>

                  <div className="mt-10">
                    <div className="h-px w-14 bg-accent-600/55" />

                    <div className="mt-5">
                      <p className="text-sm font-medium text-ink-800">
                        {t.name}
                      </p>
                      <p className="mt-1 text-xs tracking-wide text-ink-400">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 sm:h-20 bg-gradient-to-t from-ink-50 to-transparent" />
    </section>
  );
}
