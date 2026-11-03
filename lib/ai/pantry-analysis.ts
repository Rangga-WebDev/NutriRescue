import { AGE_GROUPS, type AgeGroupId } from "../age-groups";
import {
  AKG_SOURCE,
  AKG_STANDARDS,
  TEXTURES_BY_AGE,
  akgPercent,
  atwaterCalories,
  computeImpactTotals,
  estimatePriceIdr,
  evaluateStuntingScore,
  urgencyFromFreshness,
} from "../nutrition-science";
import {
  FRESHNESS_STATUSES,
  INGREDIENT_CATEGORIES,
  TEMPERATURE_ZONES,
  type DetectedIngredient,
  type FreshnessStatus,
  type IngredientCategory,
  type NutriRescueResponse,
  type RecipeIngredient,
  type StorageTip,
  type TextureCategory,
} from "../../types/nutrirescue";

/** Respons AI yang tidak dapat dipakai (bukan JSON, field wajib hilang, dll.). */
export class InvalidAiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAiResponseError";
  }
}

const MAX_INGREDIENTS = 12;
const MAX_STORAGE_TIPS = 4;
const MAX_WEIGHT_G = 5000;

/** Batas atas estimasi gizi per porsi anak, untuk menyaring angka yang tidak masuk akal. */
const NUTRIENT_LIMITS = {
  protein_g: 80,
  animal_protein_g: 80,
  carbs_g: 250,
  fat_g: 80,
  iron_mg: 30,
  zinc_mg: 30,
  calcium_mg: 1500,
  vitamin_a_mcg: 3000,
} as const;

type NutrientKey = keyof typeof NUTRIENT_LIMITS;

const NUTRIENT_DESCRIPTIONS: Record<NutrientKey, string> = {
  protein_g: "Protein total (g).",
  animal_protein_g: "Bagian protein yang berasal dari sumber hewani (g).",
  carbs_g: "Karbohidrat (g).",
  fat_g: "Lemak (g).",
  iron_mg: "Zat besi (mg).",
  zinc_mg: "Seng (mg).",
  calcium_mg: "Kalsium (mg).",
  vitamin_a_mcg: "Vitamin A (mcg RE).",
};

// ---------------------------------------------------------------------------
// Skema JSON untuk structured output Gemini (`responseJsonSchema`)
// ---------------------------------------------------------------------------

type JsonSchema = Record<string, unknown>;

const stringField = (description: string): JsonSchema => ({ type: "string", description });

const numberField = (description: string, maximum: number, minimum = 0): JsonSchema => ({
  type: "number",
  description,
  minimum,
  maximum,
});

const integerField = (description: string, minimum: number, maximum: number): JsonSchema => ({
  type: "integer",
  description,
  minimum,
  maximum,
});

/** Objek dengan semua properti wajib; urutan output mengikuti urutan deklarasi. */
function objectSchema(properties: Record<string, JsonSchema>, description?: string): JsonSchema {
  const keys = Object.keys(properties);
  return {
    type: "object",
    ...(description ? { description } : {}),
    properties,
    required: keys,
    propertyOrdering: keys,
  };
}

export function buildPantryAnalysisSchema(ageGroupId: AgeGroupId): JsonSchema {
  const nutrientFields = Object.fromEntries(
    (Object.keys(NUTRIENT_LIMITS) as NutrientKey[]).map((key) => [
      key,
      numberField(NUTRIENT_DESCRIPTIONS[key], NUTRIENT_LIMITS[key]),
    ]),
  );

  return objectSchema({
    is_food_image: {
      type: "boolean",
      description: "true bila foto memuat bahan pangan yang bisa dianalisis.",
    },
    non_food_reason: stringField(
      "Alasan singkat bila is_food_image false; string kosong bila foto valid.",
    ),
    detected_ingredients: {
      type: "array",
      description: "Bahan pangan yang terlihat di foto.",
      maxItems: MAX_INGREDIENTS,
      items: objectSchema({
        name: stringField("Nama bahan dalam Bahasa Indonesia, mis. 'Bayam Hijau'."),
        category: { type: "string", enum: [...INGREDIENT_CATEGORIES] },
        estimated_weight_g: numberField("Estimasi berat total bahan yang terlihat (gram).", MAX_WEIGHT_G, 1),
        freshness_status: { type: "string", enum: [...FRESHNESS_STATUSES] },
        visual_cue: stringField("Ciri visual yang mendasari penilaian kesegaran."),
        used_in_recipe_g: numberField("Gram bahan ini yang dipakai dalam resep; 0 bila tidak dipakai.", MAX_WEIGHT_G),
      }),
    },
    recipe: objectSchema({
      title: stringField("Judul resep yang menggugah selera."),
      cooking_time_minutes: integerField("Total waktu memasak (menit).", 5, 90),
      servings: integerField("Jumlah porsi anak yang dihasilkan resep.", 1, 8),
      portion_guide: stringField("Takaran 1 porsi untuk usia target."),
      texture_category: { type: "string", enum: TEXTURES_BY_AGE[ageGroupId] },
      ingredients: {
        type: "array",
        minItems: 1,
        maxItems: 15,
        items: objectSchema({
          name: stringField("Nama bahan."),
          amount: stringField("Takaran, mis. '50 g' atau '1 butir'."),
        }),
      },
      steps: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: stringField("Satu langkah memasak."),
      },
      nutrient_retention_tip: stringField("Tips sains agar vitamin dan mineral tidak rusak saat dimasak."),
      bioavailability_booster_tip: stringField("Tips sinergi penyerapan gizi."),
    }),
    nutrition_per_serving: objectSchema(nutrientFields, "Estimasi gizi untuk 1 porsi anak."),
    scientific_explanation: stringField("2–3 kalimat penjelasan sains gizi untuk orang tua."),
    storage_tips: {
      type: "array",
      maxItems: MAX_STORAGE_TIPS,
      items: objectSchema({
        ingredient_name: stringField("Nama sisa bahan."),
        scientific_method: stringField("Cara simpan berbasis sains pangan."),
        temperature_zone: { type: "string", enum: [...TEMPERATURE_ZONES] },
        shelf_life_extension_days: integerField("Perkiraan tambahan umur simpan (hari).", 0, 90),
      }),
    },
  });
}

// ---------------------------------------------------------------------------
// Validasi & normalisasi respons AI
// ---------------------------------------------------------------------------

export interface PantryIngredient {
  name: string;
  category: IngredientCategory;
  estimated_weight_g: number;
  freshness_status: FreshnessStatus;
  visual_cue: string;
  used_in_recipe_g: number;
}

export interface PantryAnalysis {
  kind: "ok";
  ingredients: PantryIngredient[];
  recipe: {
    title: string;
    cooking_time_minutes: number;
    servings: number;
    portion_guide: string;
    texture_category: TextureCategory;
    ingredients: RecipeIngredient[];
    steps: string[];
    nutrient_retention_tip: string;
    bioavailability_booster_tip: string;
  };
  nutrition: Record<NutrientKey, number>;
  scientificExplanation: string;
  storageTips: StorageTip[];
}

export type ParsedPantryAnalysis =
  | PantryAnalysis
  | { kind: "not_food"; reason: string }
  | { kind: "no_usable_ingredients"; spoiled: PantryIngredient[] };

export function parsePantryAnalysis(
  text: string | undefined,
  ageGroupId: AgeGroupId,
): ParsedPantryAnalysis {
  const data = parseJsonObject(text);

  if (data.is_food_image === false) {
    return { kind: "not_food", reason: cleanText(data.non_food_reason, 300) };
  }

  const ingredients = asList(data.detected_ingredients)
    .flatMap(parseIngredient)
    .slice(0, MAX_INGREDIENTS);
  if (ingredients.length === 0) return { kind: "not_food", reason: "" };

  // Semua bahan busuk: resep apa pun pasti memakai bahan di luar foto, jadi tidak dipakai.
  if (ingredients.every((item) => item.freshness_status === "Tidak Layak")) {
    return { kind: "no_usable_ingredients", spoiled: ingredients };
  }
  if (!ingredients.some((item) => item.used_in_recipe_g > 0)) {
    throw new InvalidAiResponseError("Resep tidak memakai bahan yang terdeteksi.");
  }

  return {
    kind: "ok",
    ingredients,
    recipe: parseRecipe(data.recipe, ageGroupId),
    nutrition: parseNutrition(data.nutrition_per_serving),
    scientificExplanation: cleanText(data.scientific_explanation, 1200),
    storageTips: asList(data.storage_tips).flatMap(parseStorageTip).slice(0, MAX_STORAGE_TIPS),
  };
}

function parseJsonObject(text: string | undefined): Record<string, unknown> {
  if (!text?.trim()) throw new InvalidAiResponseError("Respons AI kosong.");
  // Jaga-jaga bila model membungkus JSON dengan blok kode markdown.
  const json = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new InvalidAiResponseError("Respons AI bukan JSON yang valid.");
  }
  if (!isRecord(data)) throw new InvalidAiResponseError("Respons AI bukan objek JSON.");
  return data;
}

function parseIngredient(value: unknown): PantryIngredient[] {
  if (!isRecord(value)) return [];
  const name = cleanText(value.name, 80);
  if (!name) return [];
  const freshness = oneOf(value.freshness_status, FRESHNESS_STATUSES, "Segar");
  const weight = Math.max(1, toNumber(value.estimated_weight_g, MAX_WEIGHT_G, 0));
  const used = freshness === "Tidak Layak" ? 0 : toNumber(value.used_in_recipe_g, weight, 0);

  return [
    {
      name,
      category: oneOf(value.category, INGREDIENT_CATEGORIES, "sayuran"),
      estimated_weight_g: weight,
      freshness_status: freshness,
      visual_cue: cleanText(value.visual_cue, 200),
      used_in_recipe_g: used,
    },
  ];
}

function parseRecipe(value: unknown, ageGroupId: AgeGroupId): PantryAnalysis["recipe"] {
  if (!isRecord(value)) throw new InvalidAiResponseError("Resep tidak ditemukan.");
  const title = cleanText(value.title, 120);
  const steps = asList(value.steps)
    .map((step) => cleanText(step, 500))
    .filter(Boolean)
    .slice(0, 8);
  if (!title || steps.length === 0) {
    throw new InvalidAiResponseError("Resep tidak lengkap (judul atau langkah kosong).");
  }

  const allowedTextures = TEXTURES_BY_AGE[ageGroupId];
  return {
    title,
    cooking_time_minutes: clampInteger(value.cooking_time_minutes, 5, 90, 20),
    servings: clampInteger(value.servings, 1, 8, 1),
    portion_guide: cleanText(value.portion_guide, 200),
    texture_category: oneOf(value.texture_category, allowedTextures, allowedTextures[0]),
    ingredients: asList(value.ingredients)
      .flatMap((item): RecipeIngredient[] => {
        if (!isRecord(item)) return [];
        const name = cleanText(item.name, 80);
        return name ? [{ name, amount: cleanText(item.amount, 60) }] : [];
      })
      .slice(0, 15),
    steps,
    nutrient_retention_tip: cleanText(value.nutrient_retention_tip, 500),
    bioavailability_booster_tip: cleanText(value.bioavailability_booster_tip, 500),
  };
}

function parseNutrition(value: unknown): PantryAnalysis["nutrition"] {
  if (!isRecord(value)) throw new InvalidAiResponseError("Estimasi gizi tidak ditemukan.");
  const nutrition = Object.fromEntries(
    (Object.keys(NUTRIENT_LIMITS) as NutrientKey[]).map((key) => [
      key,
      toNumber(value[key], NUTRIENT_LIMITS[key], 1),
    ]),
  ) as PantryAnalysis["nutrition"];
  nutrition.animal_protein_g = Math.min(nutrition.animal_protein_g, nutrition.protein_g);
  return nutrition;
}

function parseStorageTip(value: unknown): StorageTip[] {
  if (!isRecord(value)) return [];
  const ingredientName = cleanText(value.ingredient_name, 80);
  const method = cleanText(value.scientific_method, 500);
  if (!ingredientName || !method) return [];
  return [
    {
      ingredient_name: ingredientName,
      scientific_method: method,
      temperature_zone: oneOf(value.temperature_zone, TEMPERATURE_ZONES, "Chiller (2-4°C)"),
      shelf_life_extension_days: clampInteger(value.shelf_life_extension_days, 0, 90, 0),
    },
  ];
}

// ---------------------------------------------------------------------------
// Perakitan respons akhir dengan perhitungan sains deterministik
// ---------------------------------------------------------------------------

export function toNutriRescueResponse(
  analysis: PantryAnalysis,
  ageGroupId: AgeGroupId,
  meta: NutriRescueResponse["meta"],
): NutriRescueResponse {
  const age = AGE_GROUPS[ageGroupId];
  const akg = AKG_STANDARDS[ageGroupId];

  const ingredients: DetectedIngredient[] = analysis.ingredients.map((item, index) => ({
    id: `bahan-${index + 1}`,
    ...item,
    urgency_level: urgencyFromFreshness(item.freshness_status),
    estimated_price_idr: estimatePriceIdr(item.estimated_weight_g, item.category),
  }));

  const cooked = ingredients.filter((item) => item.used_in_recipe_g > 0);
  const hasAnimalProtein = cooked.some((item) => item.category === "protein_hewani");
  const hasPlantProtein = cooked.some((item) => item.category === "protein_nabati");

  const { protein_g, carbs_g, fat_g, iron_mg, zinc_mg, calcium_mg, vitamin_a_mcg } =
    analysis.nutrition;
  // Protein hewani hanya diakui bila bahan hewani benar-benar dimasak.
  const animalProteinG = hasAnimalProtein ? analysis.nutrition.animal_protein_g : 0;
  const calories = atwaterCalories(protein_g, carbs_g, fat_g);
  const proteinPct = akgPercent(protein_g, akg.protein_g);
  const micronutrientPct = {
    iron_fe: akgPercent(iron_mg, akg.iron_mg),
    zinc: akgPercent(zinc_mg, akg.zinc_mg),
    calcium: akgPercent(calcium_mg, akg.calcium_mg),
    vitamin_a: akgPercent(vitamin_a_mcg, akg.vitamin_a_mcg),
  };

  const stunting = evaluateStuntingScore({
    proteinPct,
    ironPct: micronutrientPct.iron_fe,
    zincPct: micronutrientPct.zinc,
    calciumPct: micronutrientPct.calcium,
    caloriesKcal: calories,
    dailyEnergyKcal: akg.energy_kcal,
    hasAnimalProtein,
    hasPlantProtein,
  });

  const spoiled = ingredients.filter((item) => item.freshness_status === "Tidak Layak");
  const spoiledNames = spoiled.map((item) => item.name.toLowerCase());

  return {
    analysis_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    target_profile: ageGroupId,
    food_safety_alert: buildFoodSafetyAlert(spoiled),
    detected_ingredients: ingredients,
    recommended_recipe: {
      ...analysis.recipe,
      target_audience_label: `${age.stage} ${age.range}`,
    },
    nutrition_science: {
      stunting_prevention_score: stunting.score,
      score_classification: stunting.classification,
      calories_kcal: calories,
      macronutrients: {
        protein_g,
        carbs_g,
        fat_g,
        animal_protein_ratio_pct: protein_g > 0 ? Math.round((animalProteinG / protein_g) * 100) : 0,
      },
      micronutrients_per_serving: { iron_mg, zinc_mg, calcium_mg, vitamin_a_mcg },
      micronutrients_akg_pct: micronutrientPct,
      protein_akg_pct: proteinPct,
      energy_akg_pct: akgPercent(calories, akg.energy_kcal),
      akg_reference: { ...akg, source: AKG_SOURCE },
      scientific_explanation: analysis.scientificExplanation,
      protein_deficit_warning: stunting.proteinDeficitWarning,
      recommended_booster_item: stunting.recommendedBoosterItem,
    },
    food_rescue_impact: {
      ...computeImpactTotals(ingredients),
      storage_tips: analysis.storageTips.filter(
        (tip) => !spoiledNames.some((name) => tip.ingredient_name.toLowerCase().includes(name)),
      ),
    },
    meta,
  };
}

/** Banner keamanan pangan untuk bahan berstatus "Tidak Layak" (Rule Gate 1). */
export function buildFoodSafetyAlert(
  spoiled: ReadonlyArray<Pick<PantryIngredient, "name" | "visual_cue">>,
): string | null {
  if (spoiled.length === 0) return null;
  const items = spoiled
    .map((item) => {
      const cue = item.visual_cue.replace(/[.!\s]+$/, "");
      return cue ? `${item.name} (${cue.charAt(0).toLowerCase()}${cue.slice(1)})` : item.name;
    })
    .join("; ");
  return `Bahan tidak layak konsumsi: ${items}. Jangan dimasak atau dicicipi; buang dalam wadah tertutup, lalu cuci tangan dan permukaan yang tersentuh untuk mencegah keracunan pangan.`;
}

// ---------------------------------------------------------------------------
// Utilitas koersi tipe
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function toNumber(value: unknown, max: number, decimals: number): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  const factor = 10 ** decimals;
  return Math.round(Math.min(parsed, max) * factor) / factor;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = toNumber(value, max, 0);
  return parsed === 0 && min > 0 ? fallback : Math.max(min, parsed);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
