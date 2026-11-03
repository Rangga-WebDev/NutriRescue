"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle, CookingPot } from "../icons/phosphor";
import { BookOpen, Save, TriangleAlert, Undo2 } from "lucide-react";
import { formatGrams } from "../../lib/format";
import {
  openKitchenHistory,
  removeHistoryEntry,
  saveRecipeToHistory,
  useKitchenHistory,
} from "../../lib/kitchen-history";
import type { NutriRescueResponse } from "../../types/nutrirescue";

interface SaveToHistoryCardProps {
  result: NutriRescueResponse;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

/** Tombol "Simpan ke Riwayat Dapur": menandai resep selesai dimasak dan menambah counter. */
export default function SaveToHistoryCard({ result }: SaveToHistoryCardProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { rescue_history: history, cumulative_impact: totals } = useKitchenHistory();
  const [error, setError] = useState<string | null>(null);
  const [shouldFocusHeading, setShouldFocusHeading] = useState(false);
  const isSaved = history.some((entry) => entry.analysis_id === result.analysis_id);
  const savedGrams = result.food_rescue_impact.saved_weight_grams;

  // Tombol yang ditekan berganti; pindahkan fokus ke judul kartu agar perubahan terbaca.
  useEffect(() => {
    if (shouldFocusHeading) headingRef.current?.focus();
  }, [shouldFocusHeading, isSaved]);

  function handleSave() {
    const outcome = saveRecipeToHistory(result);
    setError(outcome.ok ? null : outcome.message);
    if (outcome.ok) setShouldFocusHeading(true);
  }

  function handleUndo() {
    const outcome = removeHistoryEntry(result.analysis_id);
    setError(outcome.ok ? null : outcome.message);
    if (outcome.ok) setShouldFocusHeading(true);
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-3xl p-4 shadow-sm ring-1 transition-colors sm:p-5 ${
        isSaved ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            isSaved ? "bg-white ring-emerald-200" : "bg-amber-50 ring-amber-100"
          }`}
        >
          {isSaved ? (
            <CheckCircle weight="duotone" className="size-6 text-emerald-600" />
          ) : (
            <CookingPot weight="duotone" className="size-6 text-amber-600" />
          )}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="text-base font-extrabold leading-snug text-slate-900 focus:outline-none sm:text-lg"
          >
            {isSaved ? "Tersimpan di Riwayat Dapur!" : "Sudah selesai memasak?"}
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
            {isSaved
              ? `+${formatGrams(savedGrams)} bahan terselamatkan dari tempat sampah. Total kini ${formatGrams(totals.total_saved_weight_grams)} dari ${totals.total_recipes_cooked} resep.`
              : `Simpan resep ini ke Riwayat Dapur untuk mencatat ${formatGrams(savedGrams)} bahan yang terselamatkan dari tempat sampah.`}
          </p>
        </div>
      </div>

      {isSaved ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={openKitchenHistory}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98] ${focusRing}`}
          >
            <BookOpen aria-hidden="true" className="size-5" />
            Lihat Riwayat Dapur
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98] ${focusRing}`}
          >
            <Undo2 aria-hidden="true" className="size-5" />
            Urungkan
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98] ${focusRing}`}
        >
          <Save aria-hidden="true" className="size-5" />
          Simpan ke Riwayat Dapur
        </button>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm leading-relaxed text-rose-800 ring-1 ring-rose-200"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-500" />
          {error}
        </p>
      )}
    </section>
  );
}
