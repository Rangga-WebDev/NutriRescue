import type {
  NutriRescueErrorCode,
  NutriRescueErrorResponse,
  NutriRescueRequest,
  NutriRescueResponse,
} from "../types/nutrirescue";

export type AnalyzePantryRequest = NutriRescueRequest;

/** Perkiraan durasi analisis (Gemini Flash-Lite ±5–8 detik); mengatur tempo animasi loading. */
export const EXPECTED_ANALYSIS_MS = 8000;

/** Kode error yang berarti fotonya perlu diganti, bukan sekadar dicoba ulang. */
const PHOTO_ERROR_CODES = new Set<NutriRescueErrorCode>([
  "NOT_FOOD_IMAGE",
  "NO_USABLE_INGREDIENTS",
  "INVALID_IMAGE",
  "AI_BLOCKED",
]);

/** Kegagalan analisis dengan pesan yang siap ditampilkan ke pengguna. */
export class AnalyzePantryError extends Error {
  readonly code: NutriRescueErrorCode | null;
  readonly status: number | null;

  constructor(message: string, code: NutriRescueErrorCode | null = null, status: number | null = null) {
    super(message);
    this.name = "AnalyzePantryError";
    this.code = code;
    this.status = status;
  }

  /** True bila masalahnya ada pada foto (bukan makanan, bahan busuk, format, atau ukuran). */
  get isPhotoProblem(): boolean {
    return (
      (this.code !== null && PHOTO_ERROR_CODES.has(this.code)) ||
      this.status === 413 ||
      this.status === 415
    );
  }
}

/** Mengirim foto & kategori usia ke `POST /api/analyze`. */
export async function analyzePantry(
  request: AnalyzePantryRequest,
  signal: AbortSignal,
): Promise<NutriRescueResponse> {
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AnalyzePantryError(
      "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = isErrorResponse(body) ? body.error : null;
    throw new AnalyzePantryError(
      apiError?.message ?? `Analisis gagal (kode ${response.status}). Coba lagi sebentar.`,
      apiError?.code ?? null,
      response.status,
    );
  }
  if (!isNutriRescueResponse(body)) {
    throw new AnalyzePantryError("Respons server tidak dikenali. Coba analisis ulang.");
  }
  return body;
}

function isErrorResponse(value: unknown): value is NutriRescueErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<NutriRescueErrorResponse>).error?.message === "string"
  );
}

function isNutriRescueResponse(value: unknown): value is NutriRescueResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "analysis_id" in value &&
    "recommended_recipe" in value &&
    "nutrition_science" in value
  );
}

/** Menunggu `ms` milidetik; langsung gagal (reject) bila `signal` dibatalkan. */
export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    let timer = 0;
    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    };
    timer = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}
