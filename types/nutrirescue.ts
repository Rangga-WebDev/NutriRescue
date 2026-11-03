import type { AgeGroupId } from "../lib/age-groups";

/*
 * Kontrak data NutriRescue (mengacu pada data_architecture_business_logic_nutrirescue.md).
 * Nilai enum disimpan sebagai array agar bisa dipakai ulang oleh skema AI dan validasi server.
 */

export const FRESHNESS_STATUSES = ["Segar", "Mulai Layu", "Tidak Layak"] as const;

export const INGREDIENT_CATEGORIES = [
  "protein_hewani",
  "protein_nabati",
  "sayuran",
  "karbohidrat",
  "lemak_bumbu",
] as const;

export const TEXTURE_CATEGORIES = [
  "Lumat/Puree",
  "Cincang Halus/Tim",
  "Cincang Kasar/Lunak",
  "Menu Keluarga Empuk",
] as const;

export const TEMPERATURE_ZONES = [
  "Chiller (2-4°C)",
  "Freezer (-18°C)",
  "Suhu Ruang Sejuk",
] as const;

export type TargetProfileId = AgeGroupId;
export type FreshnessStatus = (typeof FRESHNESS_STATUSES)[number];
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];
export type TextureCategory = (typeof TEXTURE_CATEGORIES)[number];
export type TemperatureZone = (typeof TEMPERATURE_ZONES)[number];
export type UrgencyLevel = "High" | "Medium" | "Low" | "Discard";
export type ScoreClassification = "Optimal" | "Cukup" | "Defisit Perlu Tambahan";

/** Body permintaan `POST /api/analyze`. */
export interface NutriRescueRequest {
  /** Data URL (`data:image/jpeg;base64,...`) atau string base64 murni. */
  imageBase64: string;
  targetProfile: TargetProfileId;
}

export interface DetectedIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimated_weight_g: number;
  /** Gram bahan yang dipakai dalam resep (0 bila tidak dipakai atau tidak layak). */
  used_in_recipe_g: number;
  freshness_status: FreshnessStatus;
  urgency_level: UrgencyLevel;
  visual_cue: string;
  estimated_price_idr: number;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecommendedRecipe {
  title: string;
  target_audience_label: string;
  cooking_time_minutes: number;
  /** Jumlah porsi anak yang dihasilkan resep. */
  servings: number;
  portion_guide: string;
  texture_category: TextureCategory;
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrient_retention_tip: string;
  bioavailability_booster_tip: string;
}

export interface AkgReference {
  group_label: string;
  source: string;
  energy_kcal: number;
  protein_g: number;
  iron_mg: number;
  zinc_mg: number;
  calcium_mg: number;
  vitamin_a_mcg: number;
}

/** Seluruh angka gizi berlaku untuk 1 porsi anak. */
export interface NutritionScience {
  stunting_prevention_score: number;
  score_classification: ScoreClassification;
  calories_kcal: number;
  macronutrients: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    animal_protein_ratio_pct: number;
  };
  micronutrients_per_serving: {
    iron_mg: number;
    zinc_mg: number;
    calcium_mg: number;
    vitamin_a_mcg: number;
  };
  /** Persentase terhadap AKG harian, maksimal 100. */
  micronutrients_akg_pct: {
    iron_fe: number;
    zinc: number;
    calcium: number;
    vitamin_a: number;
  };
  protein_akg_pct: number;
  energy_akg_pct: number;
  akg_reference: AkgReference;
  scientific_explanation: string;
  protein_deficit_warning: string | null;
  recommended_booster_item: string | null;
}

export interface StorageTip {
  ingredient_name: string;
  scientific_method: string;
  temperature_zone: TemperatureZone;
  shelf_life_extension_days: number;
}

export interface FoodRescueImpact {
  saved_weight_grams: number;
  discarded_weight_grams: number;
  estimated_money_saved_idr: number;
  co2_prevented_grams: number;
  methane_ch4_equivalent_grams: number;
  storage_tips: StorageTip[];
}

/** Respons sukses `POST /api/analyze`. */
export interface NutriRescueResponse {
  analysis_id: string;
  timestamp: string;
  target_profile: TargetProfileId;
  /** Terisi bila ada bahan berstatus "Tidak Layak". */
  food_safety_alert: string | null;
  detected_ingredients: DetectedIngredient[];
  recommended_recipe: RecommendedRecipe;
  nutrition_science: NutritionScience;
  food_rescue_impact: FoodRescueImpact;
  meta: {
    model: string;
    processing_ms: number;
  };
}

export type NutriRescueErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_IMAGE"
  | "NOT_FOOD_IMAGE"
  | "NO_USABLE_INGREDIENTS"
  | "AI_BLOCKED"
  | "AI_NOT_CONFIGURED"
  | "AI_RATE_LIMITED"
  | "AI_TIMEOUT"
  | "AI_UNAVAILABLE"
  | "AI_INVALID_RESPONSE";

/** Respons gagal `POST /api/analyze`. */
export interface NutriRescueErrorResponse {
  error: {
    code: NutriRescueErrorCode;
    message: string;
  };
}
