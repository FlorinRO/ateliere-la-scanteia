// Navbar.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/Ateliere_la_Scanteia.svg";

const NAV_LINKS = [
  { label: "Spațiul", to: "/#spatiul" },
  { label: "Manifest", to: "/#manifest" },
  { label: "Jurnal", to: "/#jurnal" },
  { label: "Testimoniale", to: "/#testimoniale" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef(null);
  const headerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Keep CSS variable with navbar height
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setVar = () => {
      const h = Math.ceil(el.getBoundingClientRect().height || 0);
      document.documentElement.style.setProperty("--nav-h", `${h}px`);
    };

    setVar();

    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);

    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  // Navbar opaque only after scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToId = (id, attempt = 0) => {
    const el = document.getElementById(id);

    if (!el) {
      if (attempt < 10) setTimeout(() => scrollToId(id, attempt + 1), 40);
      return;
    }

    const navHRaw = getComputedStyle(document.documentElement)
      .getPropertyValue("--nav-h")
      .trim();
    const NAV_OFFSET = Number.parseInt(navHRaw || "110", 10) || 110;

    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const onHashNav = (id) => (e) => {
    e.preventDefault();
    setOpen(false);

    const targetHash = `#${id}`;
    if (location.pathname !== "/" || location.hash !== targetHash) {
      navigate(`/${targetHash}`);
    }
    requestAnimationFrame(() => scrollToId(id));
  };

  const onSolicitaAcces = onHashNav("membrie");

  // --- NEW: always scroll-to-top when logo clicked ---
  const onLogoClick = (e) => {
    // Prevent default link behavior to control navigation + scroll explicitly
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setOpen(false);

    // If we're not on the home path, navigate there first.
    // If we are already on '/', this does nothing — but we still want to scroll.
    if (location.pathname !== "/") {
      navigate("/");
      // Give the navigation one frame to mount content, then scroll.
      requestAnimationFrame(() => {
        // a small timeout helps in some edge cases where layout isn't ready yet
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 40);
      });
      return;
    }

    // Already on home path — just scroll to top.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // ---------------------------------------------------

  // ESC close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Click outside close
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const headerClasses = [
    "fixed top-0 left-0 right-0 z-50",
    "transition-all duration-300 ease-out",
    scrolled
      ? "bg-ink-50/95 backdrop-blur-md border-b border-ink-200/70"
      : "bg-transparent border-b border-transparent",
  ].join(" ");

  return (
    <header ref={headerRef} className={headerClasses}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        {/* use a button-like Link with explicit onClick so we always scroll to top */}
        <Link to="/" className="flex items-center" onClick={onLogoClick}>
          <img
            src={Logo}
            alt="Ateliere la Scânteia"
            className={[
              "h-10 w-auto transition-all duration-300",
              scrolled ? "opacity-100" : "opacity-90",
            ].join(" ")}
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden flex-1 items-center justify-end gap-8 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const id = link.to.split("#")[1];
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={id ? onHashNav(id) : undefined}
                className="group relative text-[13px] tracking-[0.18em] text-ink-700 transition hover:text-ink-900"
              >
                {link.label}
                <span className="pointer-events-none absolute -bottom-1 left-0 h-[1px] w-0 bg-accent-600/70 transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}

          <Link
            to="/#membrie"
            onClick={onSolicitaAcces}
            className="group relative inline-flex items-center gap-3 rounded-full border border-accent-600/80 bg-transparent px-5 py-2.5 text-[13px] font-medium tracking-[0.18em] text-ink-800 transition hover:border-accent-600 hover:text-ink-900"
          >
            <span className="relative">
              Solicită acces
              <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-accent-600/70 transition-all duration-300 group-hover:w-full" />
            </span>
            <span className="text-ink-400 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </nav>

        {/* Mobile button */}
        <button
          type="button"
          className="md:hidden h-11 w-11 flex items-center justify-center bg-transparent border-none text-black transition active:scale-[0.98]"
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={["md:hidden", open ? "pointer-events-auto" : "pointer-events-none"].join(" ")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={[
            "fixed inset-0 z-40 bg-black/30 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          ref={panelRef}
          className={[
            "fixed left-0 right-0 top-0 z-50 origin-top rounded-b-3xl border-b border-ink-200 bg-white px-6 pb-6 pt-5 shadow-soft",
            "transition-all duration-300 ease-out",
            open
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-3 scale-[0.98]",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            {/* same click behaviour for mobile logo */}
            <button onClick={onLogoClick} className="p-0 bg-transparent border-0">
              <img src={Logo} alt="Ateliere la Scânteia" className="h-9 w-auto" />
            </button>
            <button
              className="text-black p-2"
              onClick={() => setOpen(false)}
            >
              <IconClose />
            </button>
          </div>

          <nav className="mt-6">
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => {
                const id = link.to.split("#")[1];
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={id ? onHashNav(id) : () => setOpen(false)}
                      className="block py-2 text-[13px] tracking-[0.22em] text-ink-700 hover:text-ink-900 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            to="/#membrie"
            onClick={onSolicitaAcces}
            className="mt-6 block w-full rounded-full border border-accent-600 px-6 py-3 text-center text-[13px] tracking-[0.18em] text-ink-800 hover:bg-accent-50 transition"
          >
            Solicită acces →
          </Link>
        </div>
      </div>
    </header>
  );
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
