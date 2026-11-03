import { useSyncExternalStore } from "react";
import { isAgeGroupId } from "./age-groups";
import type {
  NutriRescueResponse,
  RecipeIngredient,
  ScoreClassification,
  TargetProfileId,
} from "../types/nutrirescue";

/** Kunci LocalStorage sesuai skema PersistentUserStore di dokumen arsitektur data. */
export const KITCHEN_STORE_KEY = "nutrirescue_store_v1";
const CHANGE_EVENT = "nutrirescue:kitchen-history-change";
const OPEN_EVENT = "nutrirescue:open-kitchen-history";
const SCORE_CLASSIFICATIONS: readonly string[] = ["Optimal", "Cukup", "Defisit Perlu Tambahan"];

export interface KitchenHistoryEntry {
  analysis_id: string;
  /** Waktu resep disimpan (selesai dimasak). */
  date_iso: string;
  target_profile: TargetProfileId;
  recipe_title: string;
  stunting_score: number;
  score_classification: ScoreClassification;
  saved_weight_grams: number;
  money_saved_idr: number;
  co2_prevented_grams: number;
  ingredients_used: string[];
  recipe: {
    cooking_time_minutes: number;
    servings: number;
    ingredients: RecipeIngredient[];
    steps: string[];
  };
}

export interface CumulativeImpact {
  total_saved_weight_grams: number;
  total_money_saved_idr: number;
  total_co2_prevented_grams: number;
  total_recipes_cooked: number;
}

export interface KitchenHistorySnapshot {
  cumulative_impact: CumulativeImpact;
  /** Terbaru di urutan pertama. */
  rescue_history: readonly KitchenHistoryEntry[];
}

export type HistoryWriteResult = { ok: true } | { ok: false; message: string };

const EMPTY_SNAPSHOT: KitchenHistorySnapshot = {
  cumulative_impact: {
    total_saved_weight_grams: 0,
    total_money_saved_idr: 0,
    total_co2_prevented_grams: 0,
    total_recipes_cooked: 0,
  },
  rescue_history: [],
};

let cachedRaw: string | null = null;
let cachedSnapshot = EMPTY_SNAPSHOT;

/** Riwayat Dapur + total dampak; otomatis diperbarui saat riwayat berubah (juga dari tab lain). */
export function useKitchenHistory(): KitchenHistorySnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Menyimpan resep yang selesai dimasak. Resep yang sama tidak dihitung dua kali. */
export function saveRecipeToHistory(result: NutriRescueResponse): HistoryWriteResult {
  const history = getSnapshot().rescue_history;
  if (history.some((entry) => entry.analysis_id === result.analysis_id)) return { ok: true };
  return writeHistory([toHistoryEntry(result), ...history]);
}

export function removeHistoryEntry(analysisId: string): HistoryWriteResult {
  return writeHistory(getSnapshot().rescue_history.filter((entry) => entry.analysis_id !== analysisId));
}

export function clearKitchenHistory(): HistoryWriteResult {
  return writeHistory([]);
}

/** Meminta panel Riwayat Dapur (di header) untuk terbuka dari komponen mana pun. */
export function openKitchenHistory() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenKitchenHistory(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

function getSnapshot(): KitchenHistorySnapshot {
  const raw = readStorage();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = parseStore(raw);
  }
  return cachedSnapshot;
}

function getServerSnapshot(): KitchenHistorySnapshot {
  return EMPTY_SNAPSHOT;
}

function subscribe(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KITCHEN_STORE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(KITCHEN_STORE_KEY);
  } catch {
    return null;
  }
}

function writeHistory(history: readonly KitchenHistoryEntry[]): HistoryWriteResult {
  try {
    if (history.length === 0) {
      window.localStorage.removeItem(KITCHEN_STORE_KEY);
    } else {
      const store = {
        version: 1,
        cumulative_impact: toSnapshot(history).cumulative_impact,
        rescue_history: history,
      };
      window.localStorage.setItem(KITCHEN_STORE_KEY, JSON.stringify(store));
    }
  } catch (error) {
    const isQuotaError =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return {
      ok: false,
      message: isQuotaError
        ? "Penyimpanan perangkat penuh. Hapus sebagian Riwayat Dapur lalu coba lagi."
        : "Riwayat Dapur tidak dapat disimpan karena penyimpanan browser tidak tersedia.",
    };
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return { ok: true };
}

/**
 * Total dampak selalu dihitung ulang dari rescue_history (bukan dari nilai tersimpan)
 * sehingga counter tetap konsisten ketika entri dihapus atau data rusak sebagian.
 */
function parseStore(raw: string | null): KitchenHistorySnapshot {
  if (!raw) return EMPTY_SNAPSHOT;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_SNAPSHOT;
  }
  const history =
    isRecord(data) && Array.isArray(data.rescue_history)
      ? data.rescue_history.filter(isHistoryEntry)
      : [];
  return toSnapshot(history);
}

function toSnapshot(history: readonly KitchenHistoryEntry[]): KitchenHistorySnapshot {
  if (history.length === 0) return EMPTY_SNAPSHOT;
  const sum = (key: "saved_weight_grams" | "money_saved_idr" | "co2_prevented_grams") =>
    history.reduce((total, entry) => total + entry[key], 0);
  return {
    cumulative_impact: {
      total_saved_weight_grams: sum("saved_weight_grams"),
      total_money_saved_idr: sum("money_saved_idr"),
      total_co2_prevented_grams: sum("co2_prevented_grams"),
      total_recipes_cooked: history.length,
    },
    rescue_history: history,
  };
}

function toHistoryEntry(result: NutriRescueResponse): KitchenHistoryEntry {
  const { recommended_recipe: recipe, nutrition_science: science } = result;
  const impact = result.food_rescue_impact;
  return {
    analysis_id: result.analysis_id,
    date_iso: new Date().toISOString(),
    target_profile: result.target_profile,
    recipe_title: recipe.title,
    stunting_score: science.stunting_prevention_score,
    score_classification: science.score_classification,
    saved_weight_grams: impact.saved_weight_grams,
    money_saved_idr: impact.estimated_money_saved_idr,
    co2_prevented_grams: impact.co2_prevented_grams,
    ingredients_used: result.detected_ingredients
      .filter((item) => item.used_in_recipe_g > 0)
      .map((item) => item.name),
    recipe: {
      cooking_time_minutes: recipe.cooking_time_minutes,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    },
  };
}

function isHistoryEntry(value: unknown): value is KitchenHistoryEntry {
  if (!isRecord(value) || !isRecord(value.recipe)) return false;
  const recipe = value.recipe;
  return (
    typeof value.analysis_id === "string" &&
    typeof value.date_iso === "string" &&
    isAgeGroupId(value.target_profile) &&
    typeof value.recipe_title === "string" &&
    isFiniteNumber(value.stunting_score) &&
    typeof value.score_classification === "string" &&
    SCORE_CLASSIFICATIONS.includes(value.score_classification) &&
    isFiniteNumber(value.saved_weight_grams) &&
    isFiniteNumber(value.money_saved_idr) &&
    isFiniteNumber(value.co2_prevented_grams) &&
    isStringArray(value.ingredients_used) &&
    isFiniteNumber(recipe.cooking_time_minutes) &&
    isFiniteNumber(recipe.servings) &&
    isStringArray(recipe.steps) &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every(
      (item) => isRecord(item) && typeof item.name === "string" && typeof item.amount === "string",
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
