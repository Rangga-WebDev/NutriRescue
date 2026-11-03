import { useId, type ReactNode } from "react";
import {
  Coins,
  GlobeHemisphereEast,
  Leaf,
  Lifebuoy,
  Snowflake,
  ThermometerCold,
  ThermometerSimple,
} from "../icons/phosphor";
import { Hourglass } from "lucide-react";
import { formatGrams, formatRupiah } from "../../lib/format";
import type {
  DetectedIngredient,
  FoodRescueImpact,
  TemperatureZone,
} from "../../types/nutrirescue";
import ResultSection from "./ResultSection";

interface FoodRescueTipsProps {
  impact: FoodRescueImpact;
  ingredients: DetectedIngredient[];
}

const ZONE_STYLES: Record<TemperatureZone, { icon: ReactNode; label: string; chip: string }> = {
  "Chiller (2-4°C)": {
    icon: <ThermometerCold weight="bold" className="size-3.5" />,
    label: "Chiller 2–4°C",
    chip: "bg-sky-100 text-sky-900",
  },
  "Freezer (-18°C)": {
    icon: <Snowflake weight="bold" className="size-3.5" />,
    label: "Freezer −18°C",
    chip: "bg-indigo-100 text-indigo-900",
  },
  "Suhu Ruang Sejuk": {
    icon: <ThermometerSimple weight="bold" className="size-3.5" />,
    label: "Suhu ruang sejuk",
    chip: "bg-amber-100 text-amber-900",
  },
};

export default function FoodRescueTips({ impact, ingredients }: FoodRescueTipsProps) {
  const headingId = useId();
  const leftoverNames = ingredients
    .filter(
      (item) =>
        item.freshness_status !== "Tidak Layak" && item.estimated_weight_g > item.used_in_recipe_g,
    )
    .map((item) => item.name);

  return (
    <ResultSection
      headingId={headingId}
      tone="sky"
      icon={<Lifebuoy weight="duotone" className="size-6" />}
      title="Food Rescue Tips"
      description="Dampak memasak resep ini dan cara menyimpan sisa bahan agar lebih awet."
    >
      <dl className="grid grid-cols-3 gap-2">
        <ImpactStat
          icon={<Leaf weight="duotone" className="size-5 text-emerald-600" />}
          label="pangan diselamatkan"
          value={formatGrams(impact.saved_weight_grams)}
        />
        <ImpactStat
          icon={<Coins weight="duotone" className="size-5 text-amber-600" />}
          label="belanja dihemat"
          value={formatRupiah(impact.estimated_money_saved_idr)}
        />
        <ImpactStat
          icon={<GlobeHemisphereEast weight="duotone" className="size-5 text-sky-600" />}
          label="CO₂e dicegah"
          value={formatGrams(impact.co2_prevented_grams)}
          hint="Setara dengan mengurangi asap kendaraan bermotor"
        />
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Sampah pangan yang membusuk di TPA menghasilkan gas metana; memasaknya hari ini mencegah emisi
        tersebut.
      </p>

      {impact.storage_tips.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {impact.storage_tips.map((tip, index) => {
            const zone = ZONE_STYLES[tip.temperature_zone];
            return (
              <li
                key={`${index}-${tip.ingredient_name}`}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900">{tip.ingredient_name}</h4>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${zone.chip}`}>
                    <span aria-hidden="true">{zone.icon}</span>
                    {zone.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
                  {tip.scientific_method}
                </p>
                {tip.shelf_life_extension_days > 0 && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <Hourglass aria-hidden="true" className="size-3.5" />
                    Lebih awet hingga +{tip.shelf_life_extension_days} hari
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-sky-100">
          {leftoverNames.length === 0
            ? "Semua bahan layak terpakai, tidak ada sisa yang perlu disimpan."
            : `Simpan sisa ${formatNameList(leftoverNames)} dalam wadah tertutup di chiller (2–4°C), lalu olah dalam 1–2 hari agar tidak terbuang.`}
        </p>
      )}

      {impact.discarded_weight_grams > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-rose-800">
          {formatGrams(impact.discarded_weight_grams)} bahan tidak layak konsumsi tidak dihitung
          sebagai pangan diselamatkan.
        </p>
      )}
    </ResultSection>
  );
}

/** "A", "A dan B", atau "A, B, dan C". */
function formatNameList(names: string[]): string {
  const lower = names.map((name) => name.toLowerCase());
  if (lower.length <= 2) return lower.join(" dan ");
  return `${lower.slice(0, -1).join(", ")}, dan ${lower.at(-1)}`;
}

function ImpactStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div title={hint} className="flex flex-col items-center rounded-2xl bg-white px-1.5 py-3 text-center ring-1 ring-sky-100">
      <span aria-hidden="true" className="leading-none">
        {icon}
      </span>
      <dt className="order-2 mt-0.5 text-xs leading-tight text-slate-600">{label}</dt>
      <dd className="order-1 mt-1.5 text-sm font-extrabold tabular-nums text-slate-900 sm:text-base">
        {value}
      </dd>
    </div>
  );
}
