"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BookOpenText,
  Coins,
  CookingPot,
  GlobeHemisphereEast,
  Leaf,
  Timer,
} from "../icons/phosphor";
import { ChevronDown, Trash, X } from "lucide-react";
import { AGE_GROUPS } from "../../lib/age-groups";
import { formatDateTime, formatGrams, formatRupiah } from "../../lib/format";
import {
  clearKitchenHistory,
  removeHistoryEntry,
  useKitchenHistory,
  type HistoryWriteResult,
  type KitchenHistoryEntry,
} from "../../lib/kitchen-history";
import type { ScoreClassification } from "../../types/nutrirescue";

interface KitchenHistoryDialogProps {
  onClose: () => void;
}

const SCORE_CHIP: Record<ScoreClassification, string> = {
  Optimal: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Cukup: "bg-amber-50 text-amber-900 ring-amber-200",
  "Defisit Perlu Tambahan": "bg-rose-50 text-rose-800 ring-rose-200",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export default function KitchenHistoryDialog({ onClose }: KitchenHistoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const { rescue_history: history, cumulative_impact: totals } = useKitchenHistory();
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Strict Mode menjalankan efek dua kali; jangan buka dialog yang sudah terbuka.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function close() {
    dialogRef.current?.close();
  }

  function applyChange(result: HistoryWriteResult) {
    setError(result.ok ? null : result.message);
    // Tombol yang ditekan ikut hilang; kembalikan fokus ke judul panel.
    if (result.ok) headingRef.current?.focus();
  }

  function handleClearAll() {
    setIsConfirmingClear(false);
    applyChange(clearKitchenHistory());
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // Klik di luar panel (area backdrop) menutup dialog.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="mx-0 mb-0 mt-auto max-h-[88dvh] w-full max-w-full overflow-hidden rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-3xl motion-safe:open:animate-pop-in motion-safe:backdrop:animate-fade-in"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            className="flex items-center gap-2 text-lg font-extrabold focus:outline-none"
          >
            <BookOpenText aria-hidden="true" weight="duotone" className="size-6 text-emerald-700" />
            Riwayat Dapur
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup Riwayat Dapur"
            className={`inline-flex size-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${focusRing}`}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
          <dl className="grid grid-cols-2 gap-2">
            <TotalStat
              icon={<Leaf weight="duotone" className="size-5 text-emerald-600" />}
              label="Pangan terselamatkan"
              value={formatGrams(totals.total_saved_weight_grams)}
            />
            <TotalStat
              icon={<CookingPot weight="duotone" className="size-5 text-emerald-600" />}
              label="Resep dimasak"
              value={`${totals.total_recipes_cooked}`}
            />
            <TotalStat
              icon={<Coins weight="duotone" className="size-5 text-amber-600" />}
              label="Belanja dihemat"
              value={formatRupiah(totals.total_money_saved_idr)}
            />
            <TotalStat
              icon={<GlobeHemisphereEast weight="duotone" className="size-5 text-sky-600" />}
              label="CO₂e dicegah"
              value={formatGrams(totals.total_co2_prevented_grams)}
            />
          </dl>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          {history.length === 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
              <CookingPot aria-hidden="true" weight="duotone" className="mx-auto size-12 text-slate-400" />
              <p className="mt-2 font-bold text-slate-900">Belum ada resep tersimpan</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Selesai memasak? Tekan <strong>Simpan ke Riwayat Dapur</strong> di bawah hasil
                analisis agar bahan yang terselamatkan tercatat di sini.
              </p>
            </div>
          ) : (
            <>
              <h3 className="mt-5 text-sm font-bold text-slate-900">
                Resep tersimpan <span className="font-medium text-slate-500">(terbaru dulu)</span>
              </h3>
              <ul className="mt-2 space-y-2">
                {history.map((entry) => (
                  <HistoryItem
                    key={entry.analysis_id}
                    entry={entry}
                    onDelete={() => applyChange(removeHistoryEntry(entry.analysis_id))}
                  />
                ))}
              </ul>

              {isConfirmingClear ? (
                <div className="mt-5 rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
                  <p className="text-sm font-semibold leading-relaxed text-rose-900">
                    Hapus semua {history.length} resep? Counter pangan terselamatkan akan kembali ke 0.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className={`inline-flex h-11 items-center rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 ${focusRing}`}
                    >
                      Ya, hapus semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClear(false)}
                      className={`inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 ${focusRing}`}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className={`mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 ${focusRing}`}
                >
                  <Trash aria-hidden="true" className="size-4" />
                  Hapus semua riwayat
                </button>
              )}
            </>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Riwayat hanya tersimpan di browser perangkat ini (LocalStorage) dan tidak dikirim ke server.
          </p>
        </div>
      </div>
    </dialog>
  );
}

function TotalStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-emerald-50/70 p-3 ring-1 ring-emerald-100">
      <dt className="order-2 text-xs text-slate-600">{label}</dt>
      <dd className="order-1 flex items-center gap-1.5 text-base font-extrabold tabular-nums text-slate-900">
        <span aria-hidden="true">{icon}</span>
        {value}
      </dd>
    </div>
  );
}

function HistoryItem({ entry, onDelete }: { entry: KitchenHistoryEntry; onDelete: () => void }) {
  const age = AGE_GROUPS[entry.target_profile];

  return (
    <li className="rounded-2xl bg-white ring-1 ring-slate-200">
      <details className="group">
        <summary
          className={`flex cursor-pointer list-none items-start gap-3 rounded-2xl p-4 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-snug text-slate-900">{entry.recipe_title}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(entry.date_iso)} · {age.stage} {age.range}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                <Leaf aria-hidden="true" weight="fill" className="size-3.5" />
                +{formatGrams(entry.saved_weight_grams)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${SCORE_CHIP[entry.score_classification]}`}>
                Skor {entry.stunting_score}
              </span>
            </div>
          </div>
          <ChevronDown
            aria-hidden="true"
            className="mt-1 size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-slate-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-700">
          {entry.ingredients_used.length > 0 && (
            <p>
              <span className="font-semibold text-slate-900">Bahan diselamatkan:</span>{" "}
              {entry.ingredients_used.join(", ")}
            </p>
          )}
          <p className="mt-1 text-slate-600">
            <Timer aria-hidden="true" weight="bold" className="mr-1 inline size-4 align-[-3px]" />
            {entry.recipe.cooking_time_minutes} menit · {entry.recipe.servings} porsi · hemat{" "}
            {formatRupiah(entry.money_saved_idr)} · {formatGrams(entry.co2_prevented_grams)} CO₂e dicegah
          </p>

          {entry.recipe.ingredients.length > 0 && (
            <>
              <h4 className="mt-3 font-bold text-slate-900">Bahan</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {entry.recipe.ingredients.map((item, index) => (
                  <li key={`${index}-${item.name}`}>
                    {item.name}
                    {item.amount && <span className="text-slate-500"> — {item.amount}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h4 className="mt-3 font-bold text-slate-900">Langkah memasak</h4>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {entry.recipe.steps.map((step, index) => (
              <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
            ))}
          </ol>

          <button
            type="button"
            onClick={onDelete}
            className={`mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 ${focusRing}`}
          >
            <Trash aria-hidden="true" className="size-4" />
            Hapus dari riwayat
          </button>
        </div>
      </details>
    </li>
  );
}
