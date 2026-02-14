import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Spatiul from "./components/Spatiul";
import Manifest from "./components/Manifest";
import Testimoniale from "./components/Testimoniale";
import Jurnal, { JurnalAllPage, JurnalArticlePage } from "./components/Jurnal";
import Membrie from "./components/Membrie";
import Footer from "./components/Footer";

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // No hash => go top instantly
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = hash.slice(1);
    const NAV_OFFSET = 110;

    let raf = 0;
    let tries = 0;
    const MAX_TRIES = 24;

    const go = () => {
      const el = document.getElementById(id);

      // If we navigated and sections aren't mounted yet, retry shortly.
      if (!el) {
        tries += 1;
        if (tries <= MAX_TRIES) {
          raf = requestAnimationFrame(go);
        }
        return;
      }

      const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    // Let the route paint first
    const t = setTimeout(() => {
      raf = requestAnimationFrame(go);
    }, 0);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [pathname, hash]);

  return null;
}

function HomePage() {
  return (
    <main className="w-full">
      <Hero />
      <Spatiul />
      <Testimoniale />
      <Manifest />

      {/* ✅ Seam-killer transition: overlaps upward over Manifest and blends into Jurnal's cream */}
      <div className="pointer-events-none relative z-10 -mt-28 h-0">
        <div className="absolute inset-x-0 -top-44 h-[26rem] bg-gradient-to-b from-white via-ink-50/45 to-ink-50 blur-[200px] opacity-95" />
        <div className="absolute inset-x-0 -top-80 h-[40rem] bg-gradient-to-b from-ink-50/65 via-ink-50/25 to-transparent blur-[260px] opacity-70" />
      </div>

      <Jurnal />

      {/* ✅ Seam-killer transition: overlaps upward into Jurnal and blends into Membrie */}
      <div className="pointer-events-none relative z-10 -mt-24 h-0">
        <div className="absolute inset-x-0 -top-40 h-[28rem] bg-gradient-to-b from-transparent via-[#f4f1ea]/70 to-[#f4f1ea] blur-[160px] opacity-95" />
        <div className="absolute inset-x-0 -top-60 h-[36rem] bg-gradient-to-b from-[#f4f1ea]/60 via-[#f4f1ea]/30 to-transparent blur-[220px] opacity-70" />
      </div>

      <Membrie />
    </main>
  );
}

/**
 * ✅ FooterBlend
 * Only apply the "overlap blur" when we're on the home page,
 * because that blend is designed specifically for Membrie -> Footer.
 */
function FooterBlend() {
  const { pathname } = useLocation();
  if (pathname !== "/") return null;

  return (
    <div className="pointer-events-none relative z-20 -mt-10 h-0">
      <div className="absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-transparent via-[#f4f1ea]/70 to-[#f4f1ea] blur-[80px] opacity-100" />
      <div className="absolute inset-x-0 -top-2 mx-auto h-px w-[min(920px,92vw)] bg-black/10" />
    </div>
  );
}

export default function App() {
  // ✅ Brave scroll safety: prevent html/body getting stuck with overflow shorthand like "hidden auto"
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Reset any bad leftovers
    html.style.overflow = "";
    body.style.overflow = "";
    body.style.position = "";
    body.style.top = "";
    body.style.width = "";

    // Keep vertical scroll working
    html.style.overflowX = "hidden";
    html.style.overflowY = "auto";
    body.style.overflowX = "hidden";
    body.style.overflowY = "auto";

    // Extra safety: avoid “scroll lock” from other libs/components
    const prevOverscroll = html.style.overscrollBehavior;
    html.style.overscrollBehavior = "auto";

    return () => {
      html.style.overscrollBehavior = prevOverscroll || "";
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-dvh w-full bg-canvas text-ink-900">
        <Navbar />
        <ScrollToHash />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jurnal" element={<JurnalAllPage />} />
          <Route path="/jurnal/:slug" element={<JurnalArticlePage />} />
        </Routes>

        {/* ✅ blend only on home, then footer always everywhere */}
        <FooterBlend />
        <Footer />
      </div>
    </BrowserRouter>
  );
}
