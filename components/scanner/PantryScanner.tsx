"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChefHat, CircleCheck, TriangleAlert } from "lucide-react";
import {
  AGE_GROUPS,
  DEFAULT_AGE_GROUP_ID,
  type AgeGroupId,
} from "../../lib/age-groups";
import {
  AnalyzePantryError,
  analyzePantry,
  delay,
  EXPECTED_ANALYSIS_MS,
} from "../../lib/analyze-pantry";
import { compressImage, type CompressedImage } from "../../lib/compress-image";
import { scrollIntoViewSmoothly } from "../../lib/scroll";
import type { NutriRescueResponse } from "../../types/nutrirescue";
import AgeGroupSelector from "./AgeGroupSelector";
import CookingLoader from "./CookingLoader";
import PhotoPicker from "./PhotoPicker";
import ResultPanel from "./ResultPanel";
import StepHeading from "./StepHeading";

type AnalysisStatus = "idle" | "cooking" | "serving" | "ready";

/** Jeda singkat menampilkan "Resep siap disajikan!" sebelum loader ditutup. */
const SERVING_PAUSE_MS = 900;
const GENERIC_ANALYSIS_ERROR = "Analisis belum berhasil. Periksa koneksi internet lalu coba lagi.";

const cardClass =
  "rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-5";

export default function PantryScanner() {
  const [photo, setPhoto] = useState<CompressedImage | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [ageGroupId, setAgeGroupId] = useState<AgeGroupId>(DEFAULT_AGE_GROUP_ID);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<NutriRescueResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const photoStepId = useId();
  const ageStepId = useId();
  const photoSectionRef = useRef<HTMLElement>(null);
  const photoHeadingRef = useRef<HTMLHeadingElement>(null);
  const analyzeButtonRef = useRef<HTMLButtonElement>(null);
  const photoRequestRef = useRef(0);
  const analysisRef = useRef<AbortController | null>(null);

  useEffect(() => () => analysisRef.current?.abort(), []);

  const ageGroup = AGE_GROUPS[ageGroupId];
  const isAnalyzing = status === "cooking" || status === "serving";

  // Hasil lama tidak berlaku lagi begitu foto atau usia anak diganti.
  function invalidateResult() {
    setStatus((current) => (current === "ready" ? "idle" : current));
    setResult(null);
    setAnalysisError(null);
  }

  function revealPhotoStep() {
    photoHeadingRef.current?.focus({ preventScroll: true });
    scrollIntoViewSmoothly(photoSectionRef.current);
  }

  async function handleSelectFile(file: File) {
    photoRequestRef.current += 1;
    const requestId = photoRequestRef.current;
    setIsProcessingPhoto(true);
    setPhotoError(null);
    invalidateResult();

    let compressed: CompressedImage | null = null;
    let errorMessage: string | null = null;
    try {
      compressed = await compressImage(file);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Foto gagal diproses. Coba foto lain ya.";
    }

    // Abaikan hasil usang bila pengguna sudah memilih atau menghapus foto lain.
    if (requestId !== photoRequestRef.current) return;
    setIsProcessingPhoto(false);
    if (compressed) setPhoto(compressed);
    setPhotoError(errorMessage);
  }

  function handleRemovePhoto() {
    photoRequestRef.current += 1;
    setPhoto(null);
    setIsProcessingPhoto(false);
    setPhotoError(null);
    invalidateResult();
  }

  function handleAgeChange(id: AgeGroupId) {
    setAgeGroupId(id);
    invalidateResult();
  }

  async function handleAnalyze() {
    if (isAnalyzing || isProcessingPhoto) return;
    if (!photo) {
      setPhotoError(
        "Foto bahan dapur dulu ya, supaya AI bisa mengenali bahan dan tingkat kesegarannya.",
      );
      revealPhotoStep();
      return;
    }

    const controller = new AbortController();
    analysisRef.current = controller;
    setAnalysisError(null);
    setStatus("cooking");
    try {
      const analysis = await analyzePantry(
        { imageBase64: photo.dataUrl, targetProfile: ageGroupId },
        controller.signal,
      );
      setResult(analysis);
      setStatus("serving");
      await delay(SERVING_PAUSE_MS, controller.signal);
      setStatus("ready");
    } catch (error) {
      // Tutup loader lebih dulu agar fokus dan gulir bisa diarahkan ke pesan error.
      flushSync(() => setStatus("idle"));
      if (!controller.signal.aborted) showAnalysisError(error);
    }
    if (analysisRef.current === controller) analysisRef.current = null;
  }

  function showAnalysisError(error: unknown) {
    const message = error instanceof AnalyzePantryError ? error.message : GENERIC_ANALYSIS_ERROR;
    if (error instanceof AnalyzePantryError && error.isPhotoProblem) {
      // Foto bukan makanan, bahannya busuk semua, atau tidak terbaca: arahkan ke langkah foto.
      setPhotoError(message);
      revealPhotoStep();
    } else {
      setAnalysisError(message);
      analyzeButtonRef.current?.focus();
    }
  }

  function handleCancelAnalysis() {
    analysisRef.current?.abort();
  }

  function handleReanalyze() {
    // Jadikan tombol utama asal fokus, agar fokus kembali ke sana bila analisis dibatalkan.
    analyzeButtonRef.current?.focus({ preventScroll: true });
    handleAnalyze();
  }

  function handleStartOver() {
    handleRemovePhoto();
    revealPhotoStep();
  }

  return (
    <div className="mx-auto grid w-full max-w-xl gap-4 px-4 lg:max-w-6xl lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8 lg:px-8">
      <div className="flex flex-col gap-4">
        <section
          ref={photoSectionRef}
          aria-labelledby={photoStepId}
          className={`scroll-my-4 ${cardClass}`}
        >
          <StepHeading
            ref={photoHeadingRef}
            id={photoStepId}
            step={1}
            title="Foto bahan dapur"
            description="Potret sayur, lauk, atau sisa bahan di meja dapur maupun kulkas."
          />
          <PhotoPicker
            photo={photo}
            isProcessing={isProcessingPhoto}
            error={photoError}
            onSelectFile={handleSelectFile}
            onRemove={handleRemovePhoto}
          />
        </section>

        <section aria-labelledby={ageStepId} className={cardClass}>
          <StepHeading
            id={ageStepId}
            step={2}
            title="Pilih usia anak"
            description="Tekstur dan target gizi resep menyesuaikan usia si kecil."
          />
          <AgeGroupSelector
            value={ageGroupId}
            onChange={handleAgeChange}
            labelledBy={ageStepId}
          />
        </section>

        {/* Menempel di bawah layar HP agar mudah dijangkau ibu jari. */}
        <div className="sticky bottom-0 z-10 -mx-4 bg-slate-50/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-slate-50/95 to-slate-50/0 lg:hidden"
          />
          {analysisError && (
            <p
              role="alert"
              className="mb-3 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm leading-relaxed text-rose-800 ring-1 ring-rose-200"
            >
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-rose-500"
              />
              {analysisError}
            </p>
          )}
          <p className="mb-2 flex items-center justify-center gap-1.5 text-center text-sm font-medium text-slate-600">
            {photo ? (
              <>
                <CircleCheck
                  aria-hidden="true"
                  className="size-4 shrink-0 text-emerald-600"
                />
                Foto siap · untuk {ageGroup.stage}{" "}
                {ageGroup.range}
              </>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-amber-500"
                />
                Foto bahan dapur dulu untuk memulai
              </>
            )}
          </p>
          <button
            ref={analyzeButtonRef}
            type="button"
            onClick={handleAnalyze}
            disabled={isProcessingPhoto}
            className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-700 px-5 text-base font-bold text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            <ChefHat
              aria-hidden="true"
              className="size-6 transition-transform group-hover:-rotate-12"
            />
            Analisis &amp; Buat Resep
          </button>
        </div>
      </div>

      <ResultPanel
        result={status === "ready" ? result : null}
        photo={photo}
        onReanalyze={handleReanalyze}
        onStartOver={handleStartOver}
      />

      {isAnalyzing && (
        <CookingLoader
          ageGroup={ageGroup}
          phase={status === "serving" ? "serving" : "cooking"}
          expectedDurationMs={EXPECTED_ANALYSIS_MS}
          onCancel={handleCancelAnalysis}
        />
      )}
    </div>
  );
}
