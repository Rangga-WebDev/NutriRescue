import type { ReactNode } from "react";

type SectionTone = "default" | "sky";

const TONES: Record<SectionTone, { card: string; icon: string }> = {
  default: { card: "bg-white ring-slate-200/70", icon: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  sky: { card: "bg-sky-50 ring-sky-200", icon: "bg-white text-sky-700 ring-sky-200" },
};

interface ResultSectionProps {
  headingId: string;
  icon: ReactNode;
  title: string;
  eyebrow?: string;
  description?: string;
  tone?: SectionTone;
  children: ReactNode;
}

/** Kerangka kartu bersama untuk tiap bagian ResultDashboard. */
export default function ResultSection({
  headingId,
  icon,
  title,
  eyebrow,
  description,
  tone = "default",
  children,
}: ResultSectionProps) {
  const styles = TONES[tone];

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-3xl p-4 shadow-sm ring-1 sm:p-5 ${styles.card}`}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${styles.icon}`}
        >
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
          )}
          <h3 id={headingId} className="text-base font-extrabold leading-snug text-slate-900 sm:text-lg">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{description}</p>
          )}
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
