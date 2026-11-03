"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Carrot, Egg, Fish, Flame, Grains, Leaf, Pepper } from "../icons/phosphor";
import {
  Check,
  CircleCheck,
  CookingPot,
  Dna,
  Lightbulb,
  ScanSearch,
} from "lucide-react";
import type { AgeGroup } from "../../lib/age-groups";

export type CookingPhase = "cooking" | "serving";

interface CookingLoaderProps {
  ageGroup: AgeGroup;
  phase: CookingPhase;
  expectedDurationMs: number;
  onCancel: () => void;
}

type StepState = "done" | "active" | "pending";

const STEPS: { icon: ReactNode; label: string }[] = [
  {
    icon: <ScanSearch className="size-4" />,
    label: "Memindai tingkat kesegaran jaringan sayur & lauk…",
  },
  {
    icon: <Dna className="size-4" />,
    label: "Menghitung profil asam amino & zat besi pencegah stunting…",
  },
  {
    icon: <CookingPot className="size-4" />,
    label: "Meracik teknik memasak ramah nutrisi…",
  },
];

const STEP_STATE_LABEL: Record<StepState, string> = {
  done: " (selesai)",
  active: " (sedang berjalan)",
  pending: " (menunggu)",
};

const STEP_ICON_STYLE: Record<StepState, string> = {
  done: "bg-emerald-600 text-white",
  active: "bg-white text-emerald-700 ring-2 ring-emerald-500",
  pending: "bg-slate-100 text-slate-400",
};

const STEP_TEXT_STYLE: Record<StepState, string> = {
  done: "text-slate-700",
  active: "font-semibold text-emerald-900",
  pending: "text-slate-500",
};

const NUTRITION_TIPS = [
  "Perasan jeruk nipis membantu penyerapan zat besi dari sayuran hijau hingga 3 kali lipat.",
  "Bayam cukup dimasak ±2 menit agar asam folat dan vitamin C tidak rusak oleh panas.",
  "Satu butir telur ayam menyumbang ±6 g protein hewani untuk mendukung kejar tumbuh anak.",
  "Sedikit minyak atau santan membantu tubuh menyerap vitamin A, D, E, dan K.",
];

const FALLING_INGREDIENTS = [
  { Icon: Leaf, color: "text-lime-300", left: "37%", delay: "0s" },
  { Icon: Egg, color: "text-amber-50", left: "53%", delay: "-0.53s" },
  { Icon: Carrot, color: "text-orange-400", left: "44%", delay: "-1.07s" },
  { Icon: Fish, color: "text-sky-200", left: "57%", delay: "-1.6s" },
  { Icon: Pepper, color: "text-rose-400", left: "40%", delay: "-2.13s" },
  { Icon: Grains, color: "text-yellow-300", left: "49%", delay: "-2.67s" },
];

const STEAM_PUFFS = [
  { left: "43%", delay: "0s" },
  { left: "50%", delay: "-0.8s" },
  { left: "57%", delay: "-1.6s" },
];

const FLAMES = [
  { offsetPx: -34, delay: "0s" },
  { offsetPx: -10, delay: "-0.2s" },
  { offsetPx: 14, delay: "-0.4s" },
];

const BUBBLES = [
  { left: "14%", delay: "0s" },
  { left: "38%", delay: "-0.6s" },
  { left: "62%", delay: "-1.2s" },
  { left: "82%", delay: "-0.9s" },
];

const TICK_MS = 200;
const TIP_ROTATION_MS = 3000;

export default function CookingLoader({
  ageGroup,
  phase,
  expectedDurationMs,
  onCancel,
}: CookingLoaderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Strict Mode menjalankan efek dua kali; jangan buka dialog yang sudah terbuka.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Tombol "Batalkan" hilang saat fase penyajian; jaga fokus tetap di dalam dialog.
  useEffect(() => {
    if (phase === "serving") dialogRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  const isServing = phase === "serving";
  const stepDurationMs = expectedDurationMs / STEPS.length;
  const activeStep = isServing
    ? STEPS.length
    : Math.min(STEPS.length - 1, Math.floor(elapsedMs / stepDurationMs));
  // Ditahan di 95% sampai hasil benar-benar siap.
  const progress = isServing
    ? 100
    : Math.min(95, Math.round((elapsedMs / expectedDurationMs) * 100));
  const tip =
    NUTRITION_TIPS[Math.floor(elapsedMs / TIP_ROTATION_MS) % NUTRITION_TIPS.length];
  const announcement = isServing
    ? "Resep siap disajikan. Membuka hasil analisis."
    : `Langkah ${activeStep + 1} dari ${STEPS.length}: ${STEPS[activeStep].label}`;

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      // Tombol "Batalkan", tombol Esc, dan gestur kembali di HP sama-sama menutup dialog.
      onClose={onCancel}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto overscroll-contain rounded-3xl bg-white p-0 text-slate-900 shadow-2xl outline-none backdrop:bg-emerald-950/70 backdrop:backdrop-blur-sm motion-safe:open:animate-pop-in motion-safe:backdrop:animate-fade-in"
    >
      <CookingScene />

      <div className="px-5 pb-5 pt-4">
        <h2 id={titleId} className="text-center text-lg font-extrabold">
          {isServing ? "Resep siap disajikan!" : "Sedang meracik resep…"}
        </h2>
        <p className="mt-0.5 text-center text-sm text-slate-600">
          Untuk {ageGroup.stage} · {ageGroup.range}
        </p>

        <div
          role="progressbar"
          aria-label="Progres analisis"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-3 space-y-1">
          {STEPS.map((step, index) => {
            const state: StepState =
              index < activeStep ? "done" : index === activeStep ? "active" : "pending";
            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors ${
                  state === "active" ? "bg-emerald-50 ring-1 ring-emerald-200" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${STEP_ICON_STYLE[state]}`}
                >
                  {state === "done" ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    <span
                      className={`flex ${state === "active" ? "motion-safe:animate-pulse" : ""}`}
                    >
                      {step.icon}
                    </span>
                  )}
                </span>
                <p className={`text-sm leading-snug ${STEP_TEXT_STYLE[state]}`}>
                  {step.label}
                  <span className="sr-only">{STEP_STATE_LABEL[state]}</span>
                </p>
              </li>
            );
          })}
        </ol>

        <div className="mt-3 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 [@media(max-height:700px)]:hidden">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
            <Lightbulb aria-hidden="true" className="size-4" />
            Tahukah Anda?
          </p>
          <p
            key={tip}
            className="mt-1 text-sm leading-relaxed text-amber-950 motion-safe:animate-fade-up"
          >
            {tip}
          </p>
        </div>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        {isServing ? (
          <p className="mt-4 flex h-12 items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
            <CircleCheck aria-hidden="true" className="size-5" />
            Membuka hasil analisis…
          </p>
        ) : (
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Batalkan
          </button>
        )}
      </div>
    </dialog>
  );
}

/** Ilustrasi panci mendidih: bahan berjatuhan, uap, sendok mengaduk, dan api kompor. */
function CookingScene() {
  return (
    <div
      data-cooking-scene
      aria-hidden="true"
      className="relative h-40 overflow-hidden bg-linear-to-b from-emerald-600 to-emerald-800"
    >
      <div className="absolute -bottom-8 left-1/2 h-32 w-60 -translate-x-1/2 rounded-full bg-amber-300/30 blur-2xl" />

      {FALLING_INGREDIENTS.map(({ Icon, color, left, delay }) => (
        <span
          key={left}
          className={`absolute top-1 leading-none animate-drop-in-pot ${color}`}
          style={{ left, animationDelay: delay }}
        >
          <Icon weight="fill" className="size-7 drop-shadow-sm" />
        </span>
      ))}

      {STEAM_PUFFS.map(({ left, delay }) => (
        <span
          key={left}
          className="absolute bottom-[104px] h-9 w-2.5 rounded-full bg-white/70 blur-[2px] animate-steam"
          style={{ left, animationDelay: delay }}
        />
      ))}

      <span className="absolute bottom-[88px] left-[57%] h-14 w-2 origin-bottom rounded-full bg-amber-500 animate-stir" />

      <span className="absolute bottom-2 left-1/2 h-1.5 w-40 -translate-x-1/2 rounded-full bg-emerald-950/50" />

      {FLAMES.map(({ offsetPx, delay }) => (
        <span
          key={offsetPx}
          className="absolute bottom-2 origin-bottom leading-none text-orange-400 animate-flicker"
          style={{ left: `calc(50% + ${offsetPx}px)`, animationDelay: delay }}
        >
          <Flame weight="fill" className="size-6" />
        </span>
      ))}

      <div className="absolute bottom-[30px] left-1/2 h-16 w-32 -translate-x-1/2">
        <span className="absolute -left-3.5 top-3 h-3 w-5 rounded-l-full bg-slate-300" />
        <span className="absolute -right-3.5 top-3 h-3 w-5 rounded-r-full bg-slate-300" />
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.25rem] rounded-t-md bg-linear-to-b from-white to-slate-300 shadow-xl shadow-emerald-950/30">
          <span className="absolute inset-x-0 top-6 h-2 bg-emerald-500" />
          <span className="absolute left-4 top-10 h-5 w-1.5 rounded-full bg-white/80" />
        </div>
        <div className="absolute -inset-x-2 -top-2 h-4 rounded-full bg-slate-100 shadow-sm">
          <div className="absolute inset-x-1.5 inset-y-1 rounded-full bg-amber-400">
            {BUBBLES.map(({ left, delay }) => (
              <span
                key={left}
                className="absolute -top-0.5 size-2 rounded-full bg-amber-100 animate-bubble"
                style={{ left, animationDelay: delay }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
