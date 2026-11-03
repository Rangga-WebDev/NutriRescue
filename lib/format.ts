const decimalFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Angka gaya Indonesia, mis. 7,2 atau 1.350. */
export function formatNumber(value: number): string {
  return decimalFormatter.format(value);
}

/** Berat dalam g, otomatis menjadi kg mulai 1.000 g. */
export function formatGrams(grams: number): string {
  return grams >= 1000 ? `${formatNumber(grams / 1000)} kg` : `${formatNumber(grams)} g`;
}

export function formatRupiah(value: number): string {
  return `Rp ${integerFormatter.format(value)}`;
}

export function formatDuration(ms: number): string {
  return `${formatNumber(ms / 1000)} detik`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Tanggal & jam gaya Indonesia, mis. "2 Nov 2026, 18.15". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormatter.format(date);
}
