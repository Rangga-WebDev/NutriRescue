import { useId, type CSSProperties } from "react";
import { ChartBar } from "../icons/phosphor";
import { Microscope, TriangleAlert } from "lucide-react";
import { formatNumber } from "../../lib/format";
import { MEAL_TARGET_PCT } from "../../lib/nutrition-science";
import type {
  NutritionScience,
  ScoreClassification,
  TargetProfileId,
} from "../../types/nutrirescue";
import ResultSection from "./ResultSection";

interface NutritionCardProps {
  science: NutritionScience;
  targetProfile: TargetProfileId;
}

const CLASSIFICATION_STYLES: Record<
  ScoreClassification,
  { stroke: string; chip: string; panel: string; message: string }
> = {
  Optimal: {
    stroke: "stroke-emerald-500",
    chip: "bg-emerald-700 text-white",
    panel: "from-emerald-50 ring-emerald-200",
    message: "Kombinasi protein hewani dan mikronutrisi kunci sudah mendukung kejar tumbuh anak.",
  },
  Cukup: {
    stroke: "stroke-amber-500",
    chip: "bg-amber-400 text-amber-950",
    panel: "from-amber-50 ring-amber-200",
    message: "Menu sudah cukup baik. Lengkapi zat gizi yang masih rendah agar perlindungan dari stunting lebih optimal.",
  },
  "Defisit Perlu Tambahan": {
    stroke: "stroke-rose-500",
    chip: "bg-rose-700 text-white",
    panel: "from-rose-50 ring-rose-200",
    message: "Menu ini perlu tambahan protein agar efektif mencegah stunting.",
  },
};

const MICRONUTRIENTS = [
  { key: "iron_fe", amountKey: "iron_mg", label: "Zat Besi (Fe)", unit: "mg" },
  { key: "zinc", amountKey: "zinc_mg", label: "Seng (Zn)", unit: "mg" },
  { key: "calcium", amountKey: "calcium_mg", label: "Kalsium (Ca)", unit: "mg" },
  { key: "vitamin_a", amountKey: "vitamin_a_mcg", label: "Vitamin A", unit: "mcg" },
] as const;

export default function NutritionCard({ science, targetProfile }: NutritionCardProps) {
  const headingId = useId();
  const style = CLASSIFICATION_STYLES[science.score_classification];
  const { macronutrients: macros, akg_reference: akg } = science;
  const isCritical = science.score_classification === "Defisit Perlu Tambahan";

  return (
    <ResultSection
      headingId={headingId}
      icon={<ChartBar weight="duotone" className="size-6" />}
      title="Analisis Gizi"
      description={`Per 1 porsi, dibandingkan AKG harian ${akg.group_label.toLowerCase()}.`}
    >
      {/* Highlight pencegahan stunting */}
      <div className={`flex items-center gap-4 rounded-2xl bg-linear-to-br to-white p-4 ring-1 ${style.panel}`}>
        <ScoreRing
          score={science.stunting_prevention_score}
          classification={science.score_classification}
          strokeClass={style.stroke}
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Skor Cegah Stunting
          </p>
          <p className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold ${style.chip}`}>
            {science.score_classification}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{style.message}</p>
        </div>
      </div>

      {science.protein_deficit_warning && (
        <div
          className={`mt-4 flex gap-3 rounded-2xl border-l-4 p-3 text-sm leading-relaxed ${
            isCritical
              ? "border-rose-500 bg-rose-50 text-rose-900"
              : "border-amber-500 bg-amber-50 text-amber-950"
          }`}
        >
          <TriangleAlert
            aria-hidden="true"
            className={`mt-0.5 size-5 shrink-0 ${isCritical ? "text-rose-600" : "text-amber-600"}`}
          />
          <div>
            <p className="font-bold">
              {isCritical ? "Peringatan defisit protein" : "Saran penyempurnaan protein"}
            </p>
            <p>{science.protein_deficit_warning}</p>
            {science.recommended_booster_item && (
              <p className="mt-1.5 font-semibold">Saran: {science.recommended_booster_item}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <NutrientBar
          label="Protein"
          amount={`${formatNumber(macros.protein_g)} g`}
          pct={science.protein_akg_pct}
          targetPct={MEAL_TARGET_PCT.protein}
        />
        <NutrientBar
          label="Kalori"
          amount={`${formatNumber(science.calories_kcal)} kkal`}
          pct={science.energy_akg_pct}
          targetPct={MEAL_TARGET_PCT.energy}
          note={
            targetProfile === "mpasi_6_12_bln"
              ? "Di usia 6–12 bulan, ASI masih memenuhi sebagian besar kebutuhan energi."
              : undefined
          }
        />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MacroStat label="Karbohidrat" value={`${formatNumber(macros.carbs_g)} g`} />
        <MacroStat label="Lemak" value={`${formatNumber(macros.fat_g)} g`} />
        <MacroStat label="Protein hewani" value={`${macros.animal_protein_ratio_pct}%`} />
      </dl>

      <h4 className="mt-5 text-sm font-bold text-slate-900">Mikronutrisi kunci pencegah stunting</h4>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {MICRONUTRIENTS.map((item) => (
          <NutrientBar
            key={item.key}
            compact
            label={item.label}
            amount={`${formatNumber(science.micronutrients_per_serving[item.amountKey])} ${item.unit}`}
            pct={science.micronutrients_akg_pct[item.key]}
            targetPct={MEAL_TARGET_PCT.micronutrient}
          />
        ))}
      </div>

      {science.scientific_explanation && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Microscope aria-hidden="true" className="size-4 text-emerald-600" />
            Penjelasan sains gizi
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
            {science.scientific_explanation}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Garis tegak pada bar = target 1 porsi. Persentase terhadap AKG harian{" "}
        {akg.group_label.toLowerCase()} ({akg.source}). Angka gizi merupakan estimasi AI dan tidak
        menggantikan saran tenaga kesehatan.
      </p>
    </ResultSection>
  );
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({
  score,
  classification,
  strokeClass,
}: {
  score: number;
  classification: ScoreClassification;
  strokeClass: string;
}) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div
      role="img"
      aria-label={`Skor cegah stunting ${score} dari 100, kategori ${classification}`}
      className="relative size-24 shrink-0 sm:size-28"
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="10" className="stroke-slate-200/70" />
        <circle
          cx="50"
          cy="50"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={`${strokeClass} motion-safe:animate-ring-fill`}
          style={
            {
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: offset,
              "--ring-circumference": RING_CIRCUMFERENCE,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none tabular-nums text-slate-900">
          {score}
        </span>
        <span className="mt-0.5 text-xs font-semibold text-slate-500">/100</span>
      </div>
    </div>
  );
}

interface NutrientBarProps {
  label: string;
  amount: string;
  /** Persentase terhadap AKG harian (0–100). */
  pct: number;
  /** Target 1 porsi dalam persen AKG harian; ditandai garis tegak pada bar. */
  targetPct: number;
  compact?: boolean;
  note?: string;
}

function NutrientBar({ label, amount, pct, targetPct, compact = false, note }: NutrientBarProps) {
  const reached = pct >= targetPct;
  const fill = reached ? "bg-emerald-500" : pct >= targetPct * 0.6 ? "bg-amber-400" : "bg-rose-400";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`min-w-0 font-bold text-slate-900 ${textSize}`}>
          {label} <span className="font-medium text-slate-600">{amount}</span>
        </p>
        <p className={`shrink-0 font-bold tabular-nums text-slate-900 ${textSize}`}>
          {pct}%<span className="sr-only"> AKG harian, target 1 porsi {targetPct}%</span>
        </p>
      </div>
      <div
        aria-hidden="true"
        className={`relative mt-1.5 rounded-full bg-slate-100 ${compact ? "h-2" : "h-3"}`}
      >
        <div
          className={`h-full origin-left rounded-full motion-safe:animate-grow-x ${fill}`}
          style={{ width: `${pct > 0 ? Math.max(pct, 2) : 0}%` }}
        />
        <span
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-slate-600"
          style={{ left: `${targetPct}%` }}
        />
      </div>
      {!compact && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {reached
            ? `Target 1 porsi (${targetPct}% AKG harian) tercapai.`
            : `Target 1 porsi: ${targetPct}% AKG harian.`}
          {note && <span className="block">{note}</span>}
        </p>
      )}
    </div>
  );
}

function MacroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-slate-50 px-2 py-2.5 ring-1 ring-slate-200/70">
      <dt className="order-2 text-xs font-medium text-slate-600">{label}</dt>
      <dd className="order-1 text-base font-extrabold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
