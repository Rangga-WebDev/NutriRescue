"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Leaf } from "../icons/phosphor";
import { BookOpen } from "lucide-react";
import { formatGrams } from "../../lib/format";
import { onOpenKitchenHistory, useKitchenHistory } from "../../lib/kitchen-history";
import KitchenHistoryDialog from "./KitchenHistoryDialog";

/** Food Waste Saved Counter: total bahan yang diselamatkan dari resep yang sudah dimasak. */
export default function FoodWasteCounter() {
  const titleId = useId();
  const { cumulative_impact: totals } = useKitchenHistory();
  const displayedGrams = useAnimatedNumber(totals.total_saved_weight_grams);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => onOpenKitchenHistory(() => setIsHistoryOpen(true)), []);

  return (
    <section
      aria-labelledby={titleId}
      className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/25 backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
      >
        <Leaf weight="duotone" className="size-6 text-emerald-700" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="sr-only">
          Pangan terselamatkan dari tempat sampah
        </h2>
        <p className="text-2xl font-extrabold leading-none tabular-nums">
          <span aria-hidden="true">{formatGrams(displayedGrams)}</span>
          <span className="sr-only" aria-live="polite">
            {formatGrams(totals.total_saved_weight_grams)}
          </span>
        </p>
        <p aria-hidden="true" className="mt-1 text-xs font-semibold leading-snug text-emerald-50">
          terselamatkan dari sampah
        </p>
        <p className="text-xs leading-snug text-emerald-50/80">
          {totals.total_recipes_cooked > 0
            ? `dari ${totals.total_recipes_cooked} resep dimasak`
            : "Belum ada resep tersimpan"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsHistoryOpen(true)}
        aria-label="Buka Riwayat Dapur"
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-2.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
      >
        <BookOpen aria-hidden="true" className="size-4" />
        Riwayat
      </button>

      {isHistoryOpen && <KitchenHistoryDialog onClose={() => setIsHistoryOpen(false)} />}
    </section>
  );
}

/** Angka yang "berhitung naik/turun" menuju nilai baru (langsung lompat bila gerakan dikurangi). */
function useAnimatedNumber(target: number, durationMs = 900): number {
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);

  useEffect(() => {
    const from = displayedRef.current;
    if (from === target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = reduceMotion ? 1 : Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (target - from) * eased);
      displayedRef.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return displayed;
}
