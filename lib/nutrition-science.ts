import type { AgeGroupId } from "./age-groups";
import type {
  AkgReference,
  DetectedIngredient,
  FreshnessStatus,
  IngredientCategory,
  ScoreClassification,
  TextureCategory,
  UrgencyLevel,
} from "../types/nutrirescue";

/*
 * Mesin sains deterministik NutriRescue (Rule Gate 1–4 pada dokumen arsitektur data).
 * Angka dari AI hanya dipakai sebagai estimasi mentah; persentase AKG, skor, dan
 * dampak lingkungan selalu dihitung ulang di sini agar konsisten dan dapat ditelusuri.
 */

export const AKG_SOURCE = "AKG Permenkes RI No. 28 Tahun 2019";

/**
 * Angka Kecukupan Gizi harian per kategori usia.
 * Kategori 2–5 tahun beririsan dengan kelompok AKG 1–3 dan 4–6 tahun; dipakai nilai
 * kelompok 4–6 tahun yang lebih tinggi agar klaim pemenuhan gizi tidak berlebihan.
 */
export const AKG_STANDARDS: Record<AgeGroupId, Omit<AkgReference, "source">> = {
  mpasi_6_12_bln: {
    group_label: "Bayi 6–11 bulan",
    energy_kcal: 800,
    protein_g: 15,
    iron_mg: 11,
    zinc_mg: 3,
    calcium_mg: 270,
    vitamin_a_mcg: 400,
  },
  anak_1_2_thn: {
    group_label: "Anak 1–3 tahun",
    energy_kcal: 1350,
    protein_g: 20,
    iron_mg: 7,
    zinc_mg: 3,
    calcium_mg: 650,
    vitamin_a_mcg: 400,
  },
  anak_2_5_thn: {
    group_label: "Anak 4–6 tahun",
    energy_kcal: 1400,
    protein_g: 25,
    iron_mg: 10,
    zinc_mg: 5,
    calcium_mg: 1000,
    vitamin_a_mcg: 450,
  },
};

/** Tekstur yang diizinkan per usia (Rule Gate 3). */
export const TEXTURES_BY_AGE: Record<AgeGroupId, TextureCategory[]> = {
  mpasi_6_12_bln: ["Lumat/Puree", "Cincang Halus/Tim"],
  anak_1_2_thn: ["Cincang Kasar/Lunak", "Menu Keluarga Empuk"],
  anak_2_5_thn: ["Menu Keluarga Empuk"],
};

/** Indeks harga rata-rata pangan rumah tangga Indonesia (Rp per gram). */
export const PRICE_PER_GRAM_IDR: Record<IngredientCategory, number> = {
  protein_hewani: 65,
  protein_nabati: 25,
  sayuran: 30,
  karbohidrat: 18,
  // Asumsi rata-rata minyak, santan, bawang, dan rempah.
  lemak_bumbu: 35,
};

/** Faktor emisi sampah pangan organik yang membusuk di TPA (FAO/IPCC), per gram. */
export const CO2E_PER_GRAM = 2.5;
export const CH4_PER_GRAM = 0.089;

/** Target 1 porsi makan terhadap AKG harian (dipakai rumus skor dan tampilan hasil). */
export const MEAL_TARGET_PCT = { protein: 35, micronutrient: 30, energy: 30 } as const;

export const PROTEIN_DEFICIT_WARNING =
  "Menu ini masih rendah protein dan asam amino esensial yang dibutuhkan untuk pertumbuhan tinggi badan anak.";
export const PLANT_PROTEIN_WARNING =
  "Protein nabati sudah baik, namun penambahan sedikit protein hewani akan menyempurnakan profil asam amino anak.";
export const ANIMAL_PROTEIN_BOOSTER =
  "Tambahkan 1 butir telur ayam (+6 g protein) atau 50 g hati ayam/ikan.";

export function urgencyFromFreshness(status: FreshnessStatus): UrgencyLevel {
  if (status === "Mulai Layu") return "High";
  if (status === "Tidak Layak") return "Discard";
  return "Medium";
}

/** Persentase pemenuhan AKG harian, dibulatkan dan dibatasi maksimal 100%. */
export function akgPercent(amount: number, dailyRequirement: number): number {
  if (!(amount > 0) || !(dailyRequirement > 0)) return 0;
  return Math.min(100, Math.round((amount / dailyRequirement) * 100));
}

/** Energi dari makronutrisi dengan faktor Atwater (4/4/9 kkal per gram). */
export function atwaterCalories(proteinG: number, carbsG: number, fatG: number): number {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

export interface StuntingScoreInput {
  proteinPct: number;
  ironPct: number;
  zincPct: number;
  calciumPct: number;
  caloriesKcal: number;
  dailyEnergyKcal: number;
  hasAnimalProtein: boolean;
  hasPlantProtein: boolean;
}

export interface StuntingScoreResult {
  score: number;
  classification: ScoreClassification;
  proteinDeficitWarning: string | null;
  recommendedBoosterItem: string | null;
}

/**
 * Skor Pencegahan Stunting (0–100):
 * S = 0,45·S_protein + 0,20·S_hewani + 0,25·S_mikro + 0,10·S_energi,
 * lalu dibatasi sesuai kondisi defisit protein (Rule Gate 2).
 */
export function evaluateStuntingScore(input: StuntingScoreInput): StuntingScoreResult {
  const microAveragePct = (input.ironPct + input.zincPct + input.calciumPct) / 3;
  const proteinScore = Math.min(100, (input.proteinPct / MEAL_TARGET_PCT.protein) * 100);
  const animalScore = input.hasAnimalProtein ? 100 : input.hasPlantProtein ? 40 : 0;
  const microScore = Math.min(100, (microAveragePct / MEAL_TARGET_PCT.micronutrient) * 100);
  const energyTargetKcal = (MEAL_TARGET_PCT.energy / 100) * input.dailyEnergyKcal;
  const energyScore =
    energyTargetKcal > 0 ? Math.min(100, (input.caloriesKcal / energyTargetKcal) * 100) : 0;
  const rawScore = Math.round(
    0.45 * proteinScore + 0.2 * animalScore + 0.25 * microScore + 0.1 * energyScore,
  );

  // Kondisi 3 – optimal: ada protein hewani, protein dan rata-rata Fe/Zn/Ca ≥ 30% AKG.
  if (input.hasAnimalProtein && input.proteinPct >= 30 && microAveragePct >= 30) {
    return {
      score: Math.min(100, Math.max(85, rawScore)),
      classification: "Optimal",
      proteinDeficitWarning: null,
      recommendedBoosterItem: null,
    };
  }

  // Kondisi 2 – hanya protein nabati, tetapi jumlahnya sudah ≥ 30% AKG.
  if (!input.hasAnimalProtein && input.hasPlantProtein && input.proteinPct >= 30) {
    return {
      score: Math.min(82, rawScore),
      classification: "Cukup",
      proteinDeficitWarning: PLANT_PROTEIN_WARNING,
      recommendedBoosterItem: ANIMAL_PROTEIN_BOOSTER,
    };
  }

  // Kondisi 1 – kritis: tanpa protein hewani atau protein < 25% AKG.
  if (!input.hasAnimalProtein || input.proteinPct < 25) {
    return {
      score: Math.min(65, rawScore),
      classification: "Defisit Perlu Tambahan",
      proteinDeficitWarning: PROTEIN_DEFICIT_WARNING,
      recommendedBoosterItem: ANIMAL_PROTEIN_BOOSTER,
    };
  }

  // Ada protein hewani dan protein ≥ 25% AKG, tetapi belum memenuhi kriteria optimal.
  return {
    score: Math.min(84, rawScore),
    classification: "Cukup",
    proteinDeficitWarning: null,
    recommendedBoosterItem: null,
  };
}

export interface ImpactTotals {
  saved_weight_grams: number;
  discarded_weight_grams: number;
  estimated_money_saved_idr: number;
  co2_prevented_grams: number;
  methane_ch4_equivalent_grams: number;
}

type ImpactIngredient = Pick<
  DetectedIngredient,
  "category" | "freshness_status" | "estimated_weight_g" | "used_in_recipe_g"
>;

/**
 * Dampak per sesi (Rule Gate 4): hanya bahan layak yang benar-benar dimasak dihitung
 * sebagai pangan diselamatkan; bahan "Tidak Layak" dicatat sebagai pangan terbuang.
 */
export function computeImpactTotals(ingredients: readonly ImpactIngredient[]): ImpactTotals {
  let savedGrams = 0;
  let discardedGrams = 0;
  let moneySaved = 0;

  for (const item of ingredients) {
    if (item.freshness_status === "Tidak Layak") {
      discardedGrams += item.estimated_weight_g;
      continue;
    }
    savedGrams += item.used_in_recipe_g;
    moneySaved += item.used_in_recipe_g * PRICE_PER_GRAM_IDR[item.category];
  }

  const saved = Math.round(savedGrams);
  return {
    saved_weight_grams: saved,
    discarded_weight_grams: Math.round(discardedGrams),
    estimated_money_saved_idr: roundToNearest(moneySaved, 100),
    co2_prevented_grams: Math.round(saved * CO2E_PER_GRAM),
    methane_ch4_equivalent_grams: Math.round(saved * CH4_PER_GRAM),
  };
}

export function estimatePriceIdr(weightGrams: number, category: IngredientCategory): number {
  return roundToNearest(weightGrams * PRICE_PER_GRAM_IDR[category], 100);
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}
