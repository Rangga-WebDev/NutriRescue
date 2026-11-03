import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
  type GenerateContentConfig,
} from "@google/genai";
import { AGE_GROUP_LIST, isAgeGroupId, type AgeGroupId } from "../../../lib/age-groups";
import {
  InvalidAiResponseError,
  buildFoodSafetyAlert,
  buildPantryAnalysisSchema,
  parsePantryAnalysis,
  toNutriRescueResponse,
} from "../../../lib/ai/pantry-analysis";
import { buildPantryUserPrompt, PANTRY_SYSTEM_INSTRUCTION } from "../../../lib/ai/pantry-prompt";
import type {
  NutriRescueErrorCode,
  NutriRescueErrorResponse,
  NutriRescueResponse,
} from "../../../types/nutrirescue";

/** Batas waktu eksekusi fungsi (detik) di platform deploy seperti Vercel. */
export const maxDuration = 60;

/** Model utama: Flash-Lite konsisten ±6–10 detik (target PRD < 8 detik). Ganti via GEMINI_MODEL. */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
/** Cadangan otomatis bila model utama sibuk, kena kuota, tidak tersedia, atau JSON-nya tidak valid. */
const DEFAULT_FALLBACK_MODEL = "gemini-3.1-flash-lite";
const ATTEMPT_TIMEOUT_MS = 20_000;
const TOTAL_TIMEOUT_MS = 50_000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_BODY_BYTES = 6 * 1024 * 1024;

/** Status Gemini yang layak dicoba ulang dengan model cadangan. */
const FALLBACK_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const DATA_URL_PREFIX = /^data:([\w.+-]+\/[\w.+-]+);base64,/i;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const BLOCKING_FINISH_REASONS = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.IMAGE_SAFETY,
]);
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * POST /api/analyze
 * Body: { imageBase64: string, targetProfile: AgeGroupId }
 * Sukses: NutriRescueResponse · Gagal: NutriRescueErrorResponse
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = performance.now();

  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return errorResponse(413, "INVALID_REQUEST", "Ukuran foto terlalu besar (maksimal 4 MB).");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Body permintaan harus berupa JSON yang valid.");
  }

  const input = parseAnalyzeRequest(body);
  if (!input.ok) return errorResponse(input.status, "INVALID_REQUEST", input.message);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse(
      503,
      "AI_NOT_CONFIGURED",
      "Layanan AI belum dikonfigurasi: GEMINI_API_KEY belum diatur di server.",
    );
  }

  const models = [
    ...new Set([
      process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL,
    ]),
  ];
  const ai = new GoogleGenAI({ apiKey });
  const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(TOTAL_TIMEOUT_MS)]);
  const contents = [
    {
      role: "user",
      parts: [
        { inlineData: { mimeType: input.mimeType, data: input.data } },
        { text: buildPantryUserPrompt(input.ageGroupId) },
      ],
    },
  ];
  const responseJsonSchema = buildPantryAnalysisSchema(input.ageGroupId);

  let lastError: unknown;
  for (const model of models) {
    let finishReason: string | undefined;
    try {
      const result = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: PANTRY_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema,
          maxOutputTokens: 8192,
          ...modelTuning(model),
          abortSignal: deadline,
          httpOptions: { timeout: ATTEMPT_TIMEOUT_MS },
        },
      });

      finishReason = result.candidates?.[0]?.finishReason;
      if (
        result.promptFeedback?.blockReason ||
        (finishReason && BLOCKING_FINISH_REASONS.has(finishReason))
      ) {
        return errorResponse(
          422,
          "AI_BLOCKED",
          "Foto tidak dapat dianalisis karena tertahan filter keamanan AI. Coba foto bahan makanan lain.",
        );
      }

      const analysis = parsePantryAnalysis(result.text, input.ageGroupId);
      if (analysis.kind === "not_food") {
        return errorResponse(
          422,
          "NOT_FOOD_IMAGE",
          [analysis.reason, "Foto ulang bahan makanan di dapur atau kulkas dengan pencahayaan terang."]
            .filter(Boolean)
            .join(" "),
        );
      }
      if (analysis.kind === "no_usable_ingredients") {
        return errorResponse(
          422,
          "NO_USABLE_INGREDIENTS",
          `${buildFoodSafetyAlert(analysis.spoiled)} Tidak ada bahan lain yang aman untuk dimasak; foto bahan segar untuk mendapatkan resep.`,
        );
      }

      const payload: NutriRescueResponse = toNutriRescueResponse(analysis, input.ageGroupId, {
        model: result.modelVersion ?? model,
        processing_ms: Math.round(performance.now() - startedAt),
      });
      return Response.json(payload, { headers: NO_STORE_HEADERS });
    } catch (error) {
      lastError = error;
      console.error(`[api/analyze] Model ${model} gagal: ${describeError(error, finishReason)}`);
      if (deadline.aborted || !shouldTryFallback(error)) break;
    }
  }

  return failureResponse(lastError, models);
}

/**
 * Gemini 2.x diatur lewat thinkingBudget, sedangkan Gemini 3+ lewat thinkingLevel dengan
 * suhu default (rekomendasi Google). Thinking rendah menjaga respons tetap cepat.
 */
function modelTuning(model: string): Pick<GenerateContentConfig, "temperature" | "thinkingConfig"> {
  if (/^gemini-2[.-]/.test(model)) {
    return { temperature: 0.4, thinkingConfig: { thinkingBudget: 512 } };
  }
  return { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } };
}

type AnalyzeInput =
  | { ok: true; ageGroupId: AgeGroupId; mimeType: string; data: string }
  | { ok: false; status: number; message: string };

function parseAnalyzeRequest(body: unknown): AnalyzeInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, status: 400, message: "Body harus berupa objek JSON." };
  }
  const { imageBase64, targetProfile } = body as Record<string, unknown>;

  if (!isAgeGroupId(targetProfile)) {
    const options = AGE_GROUP_LIST.map((group) => group.id).join(", ");
    return { ok: false, status: 400, message: `targetProfile wajib salah satu dari: ${options}.` };
  }
  if (typeof imageBase64 !== "string" || imageBase64.trim() === "") {
    return { ok: false, status: 400, message: "imageBase64 wajib berisi foto bahan dalam format base64." };
  }

  const trimmed = imageBase64.trim();
  const prefix = DATA_URL_PREFIX.exec(trimmed);
  const data = (prefix ? trimmed.slice(prefix[0].length) : trimmed).replace(/\s+/g, "");
  const mimeType = (prefix?.[1] ?? sniffImageMimeType(data))?.toLowerCase();

  if (!mimeType || !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    return {
      ok: false,
      status: 415,
      message: "Format gambar tidak didukung. Gunakan JPEG, PNG, WebP, atau HEIC.",
    };
  }
  if (data.length % 4 !== 0 || !BASE64_PATTERN.test(data)) {
    return { ok: false, status: 400, message: "imageBase64 bukan data base64 yang valid." };
  }
  if (base64ByteLength(data) > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: "Ukuran foto terlalu besar (maksimal 4 MB)." };
  }
  return { ok: true, ageGroupId: targetProfile, mimeType, data };
}

/** Mengenali format dari beberapa byte awal bila klien mengirim base64 tanpa prefix data URL. */
function sniffImageMimeType(base64: string): string | undefined {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  return undefined;
}

function base64ByteLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function shouldTryFallback(error: unknown): boolean {
  if (error instanceof ApiError) return FALLBACK_STATUSES.has(error.status);
  // JSON tidak valid, timeout per percobaan, atau gangguan jaringan.
  return error instanceof InvalidAiResponseError || isAbortLike(error) || error instanceof TypeError;
}

function failureResponse(error: unknown, models: string[]): Response {
  if (error instanceof InvalidAiResponseError) {
    return errorResponse(502, "AI_INVALID_RESPONSE", "Respons AI tidak lengkap. Silakan coba analisis ulang.");
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return errorResponse(429, "AI_RATE_LIMITED", "Kuota layanan AI sedang penuh. Coba lagi dalam 1 menit.");
    }
    if (error.status === 401 || error.status === 403) {
      return errorResponse(503, "AI_NOT_CONFIGURED", "API key Gemini tidak valid atau tidak memiliki akses.");
    }
    if (error.status === 404) {
      return errorResponse(
        503,
        "AI_NOT_CONFIGURED",
        `Model Gemini (${models.join(", ")}) tidak tersedia. Periksa nilai GEMINI_MODEL.`,
      );
    }
    if (error.status === 400 && /image|inline|mime|media/i.test(error.message)) {
      return errorResponse(
        422,
        "INVALID_IMAGE",
        "Foto tidak dapat dibaca oleh AI. Coba foto lain dalam format JPEG atau PNG.",
      );
    }
    return errorResponse(503, "AI_UNAVAILABLE", "Layanan AI sedang sibuk atau bermasalah. Coba lagi sebentar.");
  }
  if (isAbortLike(error)) {
    return errorResponse(504, "AI_TIMEOUT", "Analisis AI melebihi batas waktu. Periksa koneksi lalu coba lagi.");
  }
  return errorResponse(503, "AI_UNAVAILABLE", "Tidak dapat terhubung ke layanan AI. Periksa koneksi internet server.");
}

function describeError(error: unknown, finishReason?: string): string {
  if (error instanceof ApiError) return `HTTP ${error.status} ${error.message}`;
  if (error instanceof InvalidAiResponseError && finishReason === FinishReason.MAX_TOKENS) {
    return `${error.message} (output terpotong MAX_TOKENS)`;
  }
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function isAbortLike(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function errorResponse(status: number, code: NutriRescueErrorCode, message: string): Response {
  const body: NutriRescueErrorResponse = { error: { code, message } };
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}
