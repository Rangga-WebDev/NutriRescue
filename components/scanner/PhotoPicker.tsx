"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Leaf } from "../icons/phosphor";
import {
  Camera,
  CircleCheck,
  ImagePlus,
  LoaderCircle,
  Trash,
  TriangleAlert,
} from "lucide-react";
import { formatFileSize, type CompressedImage } from "../../lib/compress-image";

interface PhotoPickerProps {
  photo: CompressedImage | null;
  isProcessing: boolean;
  error: string | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

const outlineButton = `inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-white px-3 text-center text-[15px] font-semibold leading-tight text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50 active:scale-[0.98] ${focusRing}`;

export default function PhotoPicker({
  photo,
  isProcessing,
  error,
  onSelectFile,
  onRemove,
}: PhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openCamera = () => cameraInputRef.current?.click();
  const openGallery = () => galleryInputRef.current?.click();

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset agar memilih file yang sama tetap memicu onChange.
    event.target.value = "";
    if (file) onSelectFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onSelectFile(file);
  }

  return (
    <div
      className="mt-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* `capture` langsung membuka kamera belakang di HP; di desktop menjadi pemilih file biasa. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {isProcessing ? (
        <ProcessingState />
      ) : photo ? (
        <PhotoPreview
          photo={photo}
          isDragging={isDragging}
          onOpenCamera={openCamera}
          onOpenGallery={openGallery}
          onRemove={onRemove}
        />
      ) : (
        <EmptyState
          isDragging={isDragging}
          onOpenCamera={openCamera}
          onOpenGallery={openGallery}
        />
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3 text-sm leading-relaxed text-rose-800 ring-1 ring-rose-200"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-rose-500"
          />
          {error}
        </p>
      )}
    </div>
  );
}

interface PickerActionsProps {
  onOpenCamera: () => void;
  onOpenGallery: () => void;
}

function EmptyState({
  isDragging,
  onOpenCamera,
  onOpenGallery,
}: PickerActionsProps & { isDragging: boolean }) {
  return (
    <div
      className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
        isDragging
          ? "border-emerald-500 bg-emerald-100/60"
          : "border-emerald-300 bg-emerald-50/40"
      }`}
    >
      <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-100">
        <Camera aria-hidden="true" className="size-7 text-emerald-600" />
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white"
        >
          <Leaf weight="fill" className="size-3.5" />
        </span>
      </div>
      <p className="mt-3 font-bold text-slate-900">
        {isDragging ? "Lepaskan foto di sini" : "Foto isi dapur atau kulkas"}
      </p>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-600">
        Tata bahan di tempat terang agar AI mudah mengenali jenis dan
        kesegarannya.
      </p>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={onOpenCamera}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-semibold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98] ${focusRing}`}
        >
          <Camera aria-hidden="true" className="size-5" />
          Ambil Foto
        </button>
        <button type="button" onClick={onOpenGallery} className={outlineButton}>
          <ImagePlus aria-hidden="true" className="size-5 shrink-0" />
          Pilih dari Galeri
        </button>
      </div>
      <p className="mt-3 hidden text-xs text-slate-500 md:block">
        atau seret &amp; lepas foto ke area ini
      </p>
    </div>
  );
}

function ProcessingState() {
  return (
    <div
      role="status"
      className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 text-slate-600"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-8 animate-spin text-emerald-600 motion-reduce:animate-none"
      />
      <p className="text-sm font-medium">Menyiapkan foto…</p>
    </div>
  );
}

function PhotoPreview({
  photo,
  isDragging,
  onOpenCamera,
  onOpenGallery,
  onRemove,
}: PickerActionsProps & {
  photo: CompressedImage;
  isDragging: boolean;
  onRemove: () => void;
}) {
  return (
    <div>
      <figure>
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 ring-offset-2 transition ${
            isDragging ? "ring-4 ring-emerald-400" : ""
          }`}
        >
          {/* Latar blur agar foto portrait/landscape tetap utuh tanpa bar hitam. */}
          <Image
            src={photo.dataUrl}
            alt=""
            aria-hidden="true"
            fill
            className="scale-110 object-cover opacity-60 blur-xl"
          />
          <Image
            src={photo.dataUrl}
            alt="Pratinjau foto bahan dapur yang akan dianalisis"
            fill
            className="object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Hapus foto"
            title="Hapus foto"
            className={`absolute right-2 top-2 inline-flex size-12 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-sm transition hover:bg-rose-600 active:scale-95 ${focusRing}`}
          >
            <Trash aria-hidden="true" className="size-5" />
          </button>
        </div>
        <figcaption className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-800">
          <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
          <span>
            Siap dianalisis · {photo.width}×{photo.height} px ·{" "}
            {formatFileSize(photo.sizeBytes)}
          </span>
        </figcaption>
      </figure>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onOpenCamera} className={outlineButton}>
          <Camera aria-hidden="true" className="size-5 shrink-0 max-[359px]:hidden" />
          Foto Ulang
        </button>
        <button type="button" onClick={onOpenGallery} className={outlineButton}>
          <ImagePlus aria-hidden="true" className="size-5 shrink-0 max-[359px]:hidden" />
          Dari Galeri
        </button>
      </div>
    </div>
  );
}
