import { Link, useLocation, useNavigate } from "react-router-dom";
import cowicofiLogo from "../assets/cocologodark.png";
import siteLogo from "../assets/Ateliere_la_Scanteia.svg";

export default function Footer() {
  const year = new Date().getFullYear();

  const location = useLocation();
  const navigate = useNavigate();

  const scrollToId = (id, attempt = 0) => {
    const el = document.getElementById(id);

    if (!el) {
      if (attempt < 10) {
        setTimeout(() => scrollToId(id, attempt + 1), 40);
      }
      return;
    }

    const NAV_OFFSET = 110;
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const onHashNav = (id) => (e) => {
    e.preventDefault();
    const targetHash = `#${id}`;

    if (location.pathname !== "/" || location.hash !== targetHash) {
      navigate(`/${targetHash}`);
    }

    requestAnimationFrame(() => scrollToId(id));
  };

  return (
    <footer className="relative bg-[#f4f1ea]">
      {/* Top fade separator */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f4f1ea]/60 to-[#f4f1ea]" />
        <div className="absolute bottom-0 left-1/2 h-px w-[min(920px,92vw)] -translate-x-1/2 bg-black/10" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 pt-14">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand with Logo ONLY */}
          <div>
            <img
              src={siteLogo}
              alt="Ateliere la Scânteia logo"
              className="h-14 w-auto object-contain"
            />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600">
              Un spațiu dedicat formării artistice și dezvoltării creative a
              copiilor. Selecție atentă, comunitate restrânsă, progres real.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Navigare
            </h4>
            <ul className="mt-5 space-y-3 text-sm text-stone-700">
              <li>
                <Link
                  to="/#spatiul"
                  onClick={onHashNav("spatiul")}
                  className="hover:text-stone-900"
                >
                  Spațiul
                </Link>
              </li>
              <li>
                <Link
                  to="/#manifest"
                  onClick={onHashNav("manifest")}
                  className="hover:text-stone-900"
                >
                  Manifest
                </Link>
              </li>
              <li>
                <Link
                  to="/#jurnal"
                  onClick={onHashNav("jurnal")}
                  className="hover:text-stone-900"
                >
                  Jurnal
                </Link>
              </li>
              <li>
                <Link
                  to="/#testimoniale"
                  onClick={onHashNav("testimoniale")}
                  className="hover:text-stone-900"
                >
                  Testimoniale
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Aplicație
            </h4>
            <p className="mt-4 text-sm text-stone-600">
              Procesul de selecție este deschis pentru un număr limitat de
              locuri.
            </p>

            <div className="mt-6">
              <Link
                to="/#membrie"
                onClick={onHashNav("membrie")}
                className="inline-flex items-center justify-center rounded-full bg-accent-700 px-6 py-3 text-xs tracking-[0.22em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-800"
              >
                SOLICITĂ ACCES
              </Link>
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-sm uppercase tracking-[0.25em] text-stone-500">
              Locație
            </h4>

            <p className="mt-4 text-sm text-stone-600">
              Piața Presei Libere Nr. 1, Sector 1, București
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 shadow-sm">
              <div className="relative aspect-[16/9] w-full">
                <iframe
                  src="https://www.google.com/maps?q=44.48,26.0722&z=15&output=embed"
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Harta Ateliere la Scânteia"
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 grid gap-4 border-t border-black/10 pt-6 text-xs text-stone-500 md:grid-cols-3 md:items-center">
          {/* ✅ Removed Admin button (client will type /admin manually) */}
          <div className="hidden md:block" />

          <p className="text-center">
            © {year} Ateliere la Scânteia. Toate drepturile rezervate.
          </p>

          <div className="flex items-center justify-center gap-3 md:justify-end">
            <span>
              Website creat de{" "}
              <a
                href="https://cowicofi.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                cowicofi.eu
              </a>
            </span>
            <a
              href="https://cowicofi.eu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={cowicofiLogo}
                alt="CoWiCoFi logo"
                className="h-6 w-auto rounded-md object-contain"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
