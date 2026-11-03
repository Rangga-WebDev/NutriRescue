import type { NutriRescueResponse } from "../../types/nutrirescue";
import CookingGuide from "./CookingGuide";
import FoodRescueTips from "./FoodRescueTips";
import IngredientBadges from "./IngredientBadges";
import NutritionCard from "./NutritionCard";

interface ResultDashboardProps {
  result: NutriRescueResponse;
}

/**
 * Hasil analisis NutriRescue dalam 4 bagian: bahan terdeteksi, analisis gizi,
 * panduan memasak, dan Food Rescue Tips. Judul tiap bagian memakai <h3>.
 */
export default function ResultDashboard({ result }: ResultDashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      <IngredientBadges
        ingredients={result.detected_ingredients}
        foodSafetyAlert={result.food_safety_alert}
      />
      <NutritionCard science={result.nutrition_science} targetProfile={result.target_profile} />
      {/* key: status centang langkah direset untuk setiap hasil analisis baru. */}
      <CookingGuide key={result.analysis_id} recipe={result.recommended_recipe} />
      <FoodRescueTips
        impact={result.food_rescue_impact}
        ingredients={result.detected_ingredients}
      />
    </div>
  );
}
