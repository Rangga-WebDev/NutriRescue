"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { Carrot, ChartBar, ChefHat, CookingPot, Lifebuoy } from "../icons/phosphor";
import { Camera, RotateCcw } from "lucide-react";
import { AGE_GROUPS } from "../../lib/age-groups";
import type { CompressedImage } from "../../lib/compress-image";
import { formatDuration } from "../../lib/format";
import { scrollIntoViewSmoothly } from "../../lib/scroll";
import type { NutriRescueResponse } from "../../types/nutrirescue";
import SaveToHistoryCard from "../history/SaveToHistoryCard";
import ResultDashboard from "../result/ResultDashboard";

interface ResultPanelProps {
  result: NutriRescueResponse | null;
  photo: CompressedImage | null;
  onReanalyze: () => void;
  onStartOver: () => void;
}

const UPCOMING_RESULTS = [
  {
    Icon: Carrot,
    title: "Deteksi kesegaran",
    description: "Bahan segar, mulai layu, atau tidak layak dikenali otomatis.",
  },
  {
    Icon: ChartBar,
    title: "Skor Cegah Stunting",
    description: "Skor 0–100 plus pemenuhan AKG zat besi, seng, kalsium & vitamin A.",
  },
  {
    Icon: ChefHat,
    title: "Resep ramah nutrisi",
    description: "Langkah memasak yang menjaga vitamin & mineral tetap utuh.",
  },
  {
    Icon: Lifebuoy,
    title: "Panduan simpan",
    description: "Cara ilmiah menyimpan sisa bahan agar lebih awet.",
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export default function ResultPanel({
  result,
  photo,
  onReanalyze,
  onStartOver,
}: ResultPanelProps) {
  if (result && photo) {
    return (
      <AnalysisResult
        result={result}
        photo={photo}
        onReanalyze={onReanalyze}
        onStartOver={onStartOver}
      />
    );
  }
  return <ResultPreview />;
}

function AnalysisResult({
  result,
  photo,
  onReanalyze,
  onStartOver,
}: Omit<ResultPanelProps, "result" | "photo"> & {
  result: NutriRescueResponse;
  photo: CompressedImage;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const age = AGE_GROUPS[result.target_profile];

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    // Bawa ringkasan ke atas layar agar dashboard di bawahnya langsung terlihat.
    scrollIntoViewSmoothly(sectionRef.current, "start");
  }, []);

  return (
    // Fade saja (tanpa transform) agar posisi gulir ke kartu ringkasan tetap akurat.
    <div className="flex flex-col gap-4 motion-safe:animate-fade-in">
      <section
        ref={sectionRef}
        aria-labelledby={headingId}
        className="scroll-my-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
            <Image
              src={photo.dataUrl}
              alt="Foto bahan dapur yang dianalisis"
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Hasil analisis
            </p>
            <h2
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              className="text-lg font-extrabold leading-snug text-slate-900 focus:outline-none"
            >
              Resep siap disajikan!
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Untuk {age.stage} {age.range} · selesai dalam{" "}
              {formatDuration(result.meta.processing_ms)}
            </p>
          </div>
        </div>
      </section>

      <ResultDashboard result={result} />

      <SaveToHistoryCard result={result} />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onReanalyze}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98] ${focusRing}`}
        >
          <RotateCcw aria-hidden="true" className="size-5" />
          Analisis Ulang
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 active:scale-[0.98] ${focusRing}`}
        >
          <Camera aria-hidden="true" className="size-5" />
          Foto Bahan Lain
        </button>
      </div>
    </div>
  );
}

/** Pratinjau isi hasil untuk kolom kanan di desktop sebelum analisis dijalankan. */
function ResultPreview() {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="hidden rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 lg:block xl:p-8"
    >
      <div className="mx-auto max-w-md text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100"
        >
          <CookingPot weight="duotone" className="size-9 text-emerald-700" />
        </span>
        <h2 id={headingId} className="mt-3 text-lg font-bold text-slate-900">
          Hasil analisis akan tampil di sini
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Foto bahan dapur, pilih usia anak, lalu tekan{" "}
          <strong className="font-semibold text-slate-800">
            Analisis &amp; Buat Resep
          </strong>
          .
        </p>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {UPCOMING_RESULTS.map((item) => (
          <li
            key={item.title}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100"
            >
              <item.Icon weight="duotone" className="size-6 text-emerald-700" />
            </span>
            <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
