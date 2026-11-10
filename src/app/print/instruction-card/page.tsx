import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tabletop instruction card · wiTTy's Translation Rescue" };

/**
 * Printable A5 tabletop card (print from the browser at 100% scale, A5 or A4).
 * Deliberately has no QR codes: the FormSG QR is shown in-game and the
 * GovEntry stamp QR is official event material only.
 */
export default function InstructionCard() {
  return (
    <main className="min-h-dvh bg-neutral-200 py-8 print:bg-white print:py-0">
      <style>{`@page { size: A5 portrait; margin: 0; } @media print { .card { box-shadow: none !important; } }`}</style>
      <article
        className="card mx-auto flex flex-col gap-4 bg-white p-8 text-[#0a1640] shadow-2xl"
        style={{ width: "148mm", minHeight: "210mm" }}
      >
        <header className="rounded-2xl bg-[#0a1640] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9db8ff]">SG Translate 2.0</p>
          <h1 className="mt-1 text-3xl font-black leading-tight">wiTTy&apos;s Translation Rescue</h1>
          <p className="mt-1 text-base text-[#d9ccff]">3 missions · about 2 minutes · no sign-up</p>
        </header>
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[#5c8cff] p-3 text-xs text-[#26429a]">
          <span className="font-bold">[wiTTy artwork]</span> Placeholder: insert the approved wiTTy PNG here before printing.
        </div>
        <ol className="flex flex-col gap-3">
          {[
            ["1", "Translation Rush", "Drag each request to the right tool: SG Translate Together, Polyglot or the SGT 2.0 API."],
            ["2", "Terminology Detective", "Spot the term that doesn't match the glossary. Compare shapes; no other language needed."],
            ["3", "Save the Launch", "Run SGT, send drafts for human review, fix issues and publish before time runs out."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f6bff] to-[#7b4dff] text-lg font-black text-white">
                {n}
              </span>
              <span>
                <strong className="block text-lg">{t}</strong>
                <span className="text-sm">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <section className="rounded-xl bg-[#e3ebff] p-4 text-sm">
          <strong className="block">How to play</strong>
          Tap the screen to start. Drag or tap to play; keyboard works too. Between missions, wiTTy asks a few quick, anonymous
          questions about your real work. Skip any of them.
        </section>
        <section className="text-sm">
          <strong>Your privacy:</strong> no names, emails or free text are collected. Answers are anonymous and reported only in
          aggregate.
        </section>
        <footer className="mt-auto border-t-2 border-[#e3ebff] pt-3 text-xs text-[#26429a]">
          All game scenarios and translations are fictional and illustrative. Ask our team about SG Translate 2.0 and your GovEntry
          booth stamp.
        </footer>
      </article>
    </main>
  );
}
