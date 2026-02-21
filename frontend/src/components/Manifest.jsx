// Manifest.jsx
import { useEffect, useState } from "react";

export default function Manifest() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/mainpage/", {
      signal: controller.signal,
      cache: "no-store", // ✅ avoid stale/cached CMS content
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`Failed to load mainpage: ${r.status}`);
        return data;
      })
      .then((data) => {
        const m = data?.manifest;
        if (!m) return;

        const cards = Array.isArray(m?.cards) ? m.cards : [];

        const normalizedCards = cards
          .map((c) => ({
            title: typeof c?.title === "string" ? c.title.trim() : "",
            text: typeof c?.text === "string" ? c.text.trim() : "",
          }))
          .filter((c) => c.title || c.text)
          .slice(0, 3);

        setCms({
          label: typeof m?.label === "string" ? m.label : "",
          title: typeof m?.title === "string" ? m.title : "",
          text: typeof m?.text === "string" ? m.text : "",
          cards: normalizedCards,
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  const fallbackLabel = "( PROCESUL DE SELECȚIE )";
  const fallbackTitle = "Accesul este limitat la\n12 membri pe sezon.";
  const fallbackText =
    "Căutăm familii care înțeleg că educația estetică este o investiție pe viață.\nNu vindem cursuri. Construim fundații artistice.";

  // ✅ Removed forced line breaks (\n) from fallback card texts (no words changed)
  const fallbackCards = [
    {
      title: "Lumina naturală",
      text:
        "Arta nu se face sub neone și părinții caută un mediu de învățare sănătos, departe de lumina artificială a ecranelor. " +
        "Spațiul nostru din Casa Presei oferă o iluminare naturală ideală, vitală pentru percepția corectă a culorilor în artă. Acest aspect tehnic previne oboseala oculară și " +
        "susține concentrarea pe termen lung pe parcursul activităților educative de weekend.",
    },
    {
      title: "Mentoratul",
      text:
        "La Atelierele Scânteia, direcția educațională este asigurată de Andreea Apăvăloaei, absolventă " +
        "cu nota 10 a Universitatea Nationala de Arte Bucuresti, cu un portofoliu impresionant consolidat " +
        "pe parcursul a trei decenii, orizontul ei artistic depășește cu mult șevaletul clasic. Abordând arta " +
        "ca pe o „meditație activă”, Andreea traduce pentru cursanții noștri o experiență multidisciplinară " +
        "complexă și formare pedagogică acreditată (Certificare pedagogică DPPD).",
    },
    {
      title: "Spațiu să creeze.\nLiniște să se concentreze.",
      text:
        "Fără zgomot de fond, fără competiție inutilă pentru validarea profesorului. Acest volum aerian, " +
        "specific arhitecturii monumentale, previne suprastimularea senzorială unde copiii au libertatea " +
        "de a se mișca",
    },
  ];

  const labelText = (cms?.label || fallbackLabel).trim();
  const titleRaw = (cms?.title || fallbackTitle).trim();
  const textBody = (cms?.text || fallbackText).trim();

  const titleLines = titleRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const cardsToRender =
    cms?.cards && cms.cards.length ? cms.cards.slice(0, 3) : fallbackCards;

  const icons = [
    <IconGroup key="i1" />,
    <IconCap key="i2" />,
    <IconArchive key="i3" />,
  ];

  // ✅ "12 membri" stays on same line; 12 uses alt font, same color, slightly smaller
  const renderTitleWithStyled12 = (text) => {
    if (!text) return null;

    const str = String(text);
    const idx = str.indexOf("12");
    if (idx === -1) return str;

    const before = str.slice(0, idx);
    const after = str.slice(idx + 2);

    const m = after.match(/^(\s*)(membri)\b/i);

    if (m) {
      const spaces = m[1] || " ";
      const membriWord = m[2];
      const rest = after.slice((m[1] || "").length + membriWord.length);

      const needsSpaceBefore12 = before.length > 0 && !/\s$/.test(before);

      return (
        <>
          <span>{before}</span>
          {needsSpaceBefore12 ? "\u00A0" : null}
          <span className="whitespace-nowrap">
            <span
              className={[
                "font-mono",
                "not-italic",
                "text-accent-600",
                "text-[0.9em]",
                "align-baseline",
              ].join(" ")}
            >
              12
            </span>
            {spaces === " " ? "\u00A0" : spaces.replace(/ /g, "\u00A0")}
            <span>{membriWord}</span>
          </span>
          <span>{rest}</span>
        </>
      );
    }

    // fallback if not "12 membri"
    const parts = str.split(/(12)/g);
    return parts.map((part, i) => {
      if (part !== "12") return <span key={`p-${i}`}>{part}</span>;
      const prev = parts[i - 1] || "";
      const needsSpace = prev && !/\s$/.test(prev);
      return (
        <span key={`t-${i}`}>
          {needsSpace ? "\u00A0" : null}
          <span
            className={[
              "font-mono",
              "not-italic",
              "text-accent-600",
              "text-[0.9em]",
              "align-baseline",
            ].join(" ")}
          >
            12
          </span>
        </span>
      );
    });
  };

  return (
    <section id="manifest" className="relative bg-white py-14 sm:py-20">
      {/* Seam blends */}
      <div className="pointer-events-none absolute inset-x-0 -top-80 z-10 h-[46rem] bg-gradient-to-b from-ink-50/90 via-ink-50/40 to-transparent blur-[240px] opacity-90" />
      <div className="pointer-events-none absolute inset-x-0 -top-48 z-10 h-[34rem] bg-gradient-to-b from-ink-50/65 via-white/30 to-transparent blur-[180px] opacity-85" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-20 bg-gradient-to-b from-white via-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 bg-gradient-to-b from-transparent via-ink-50/30 to-ink-50 blur-[90px] opacity-95" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-40 z-0 h-[34rem] bg-gradient-to-b from-transparent via-ink-50/55 to-ink-50 blur-[170px] opacity-95" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-[26rem] z-0 h-[54rem] bg-gradient-to-b from-transparent via-ink-50/75 to-ink-50 blur-[260px] opacity-85" />

      <div className="relative z-20 mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs tracking-[0.26em] text-accent-600">
            {labelText}
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] text-ink-900 sm:text-6xl">
            {titleLines.length <= 1 ? (
              renderTitleWithStyled12(titleLines[0] || "")
            ) : (
              <>
                {renderTitleWithStyled12(titleLines[0])}
                <br />
                <span className="italic">
                  {renderTitleWithStyled12(titleLines.slice(1).join(" "))}
                </span>
              </>
            )}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-700">
            {textBody.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:mt-14 sm:grid-cols-3">
          {cardsToRender.map((c, idx) => (
            <Card key={idx} icon={icons[idx]} title={c.title} text={c.text} />
          ))}
        </div>

        <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-ink-200/55 to-transparent" />
      </div>
    </section>
  );
}

function Card({ icon, title, text }) {
  // ✅ Title handling:
  // - keeps your intentional line break after the first sentence
  // - BUT prevents extra CMS newlines inside the second sentence
  const rawTitleLines = String(title || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const titleLine1 = rawTitleLines[0] || "";
  const titleLine2 =
    rawTitleLines.length > 1
      ? rawTitleLines
          .slice(1)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  // ✅ Body: keep paragraph breaks (blank lines), but otherwise flow naturally
  const paragraphs = String(text || "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/g)
    .map((p) =>
      p
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-ink-200/80 bg-gradient-to-b from-[#FBF7F0] via-[#F6F1E7] to-[#F3EEE4] px-7 py-8 shadow-[0_18px_50px_rgba(0,0,0,0.07)] transition-transform duration-500 ease-out hover:-translate-y-1 sm:px-8 sm:py-10">
      {/* top accent hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-600/45 to-transparent" />

      {/* glow on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-accent-600/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-ink-900/5 blur-3xl" />
      </div>

      {/* subtle inner ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/55" />

      <div className="relative">
        <div className="mb-7 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-200 bg-gradient-to-b from-white/85 to-white/55 text-accent-600 shadow-[0_12px_30px_rgba(0,0,0,0.06)] transition-transform duration-500 group-hover:-translate-y-0.5">
          {icon}
        </div>

        <h3 className="text-[22px] font-semibold leading-[1.15] text-ink-900 sm:text-[23px]">
          {titleLine2 ? (
            <>
              {titleLine1}
              <br />
              <span className="text-ink-800">{titleLine2}</span>
            </>
          ) : (
            titleLine1
          )}
        </h3>

        <div className="mt-4 max-w-[60ch] text-[15px] leading-7 text-ink-700 break-normal">
          {paragraphs.length ? (
            paragraphs.map((p, i) => (
              <p key={i} className={i === paragraphs.length - 1 ? "" : "mb-3"}>
                {p}
              </p>
            ))
          ) : (
            <p>{String(text || "")}</p>
          )}
        </div>

        <div className="mt-7 flex items-center gap-3">
          <div className="h-[1px] w-12 bg-accent-600/60" />
          <div className="h-[1px] flex-1 bg-ink-200/60" />
        </div>
      </div>
    </div>
  );
}

function IconGroup() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M16 11a3 3 0 1 0-6 0v1a3 3 0 0 0 6 0v-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 21c.6-3.3 3-5 4.5-5h0c1.5 0 3.9 1.7 4.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 11.5a2.5 2.5 0 1 1 3.2-2.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.7 21c.3-2 .9-3.2 1.8-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCap() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 12.2V16c0 1.7 2.2 3 5 3s5-1.3 5-3v-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M21 10v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8V6.8c0-.4.3-.8.8-.8h10.4c.5 0 .8.4.8.8V8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 8h10v11c0 .6-.4 1-1 1H8c-.6 0-1-.4-1-1V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 12h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}