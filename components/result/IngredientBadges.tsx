import { useId } from "react";
import { Carrot } from "../icons/phosphor";
import { ChefHat, TriangleAlert } from "lucide-react";
import { formatGrams } from "../../lib/format";
import type { DetectedIngredient, FreshnessStatus } from "../../types/nutrirescue";
import ResultSection from "./ResultSection";

interface IngredientBadgesProps {
  ingredients: DetectedIngredient[];
  foodSafetyAlert: string | null;
}

/** Urutan tampil: bahan yang harus segera dimasak, lalu segar, lalu yang wajib dibuang. */
const STATUS_GROUPS: {
  status: FreshnessStatus;
  label: string;
  badge: string;
  dot: string;
  pulse: boolean;
}[] = [
  {
    status: "Mulai Layu",
    label: "Olahan prioritas hari ini",
    badge: "bg-amber-50 text-amber-950 ring-amber-300",
    dot: "bg-amber-500",
    pulse: true,
  },
  {
    status: "Segar",
    label: "Segar",
    badge: "bg-emerald-50 text-emerald-950 ring-emerald-200",
    dot: "bg-emerald-500",
    pulse: false,
  },
  {
    status: "Tidak Layak",
    label: "Tidak layak konsumsi — buang",
    badge: "bg-rose-50 text-rose-950 ring-rose-200",
    dot: "bg-rose-500",
    pulse: false,
  },
];

export default function IngredientBadges({ ingredients, foodSafetyAlert }: IngredientBadgesProps) {
  const headingId = useId();
  const usedCount = ingredients.filter((item) => item.used_in_recipe_g > 0).length;

  return (
    <ResultSection
      headingId={headingId}
      icon={<Carrot weight="duotone" className="size-6" />}
      title="Bahan Terdeteksi"
      description={`${ingredients.length} bahan dikenali dari foto · ${usedCount} dipakai di resep`}
    >
      {foodSafetyAlert && (
        <div
          role="alert"
          className="mb-4 flex gap-3 rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-3 text-sm leading-relaxed text-rose-900"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-600" />
          <p>
            <span className="font-bold">Peringatan keamanan pangan.</span> {foodSafetyAlert}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {STATUS_GROUPS.map((group) => {
          const items = ingredients.filter((item) => item.freshness_status === group.status);
          if (items.length === 0) return null;

          return (
            <div key={group.status}>
              <h4 className="text-sm font-bold text-slate-800">
                {group.label}{" "}
                <span className="font-medium text-slate-500">({items.length})</span>
              </h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    title={item.visual_cue || undefined}
                    className={`inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3 text-sm ring-1 ${group.badge}`}
                  >
                    <StatusDot color={group.dot} pulse={group.pulse} />
                    <span className="truncate font-semibold">{item.name}</span>
                    <span className="shrink-0 text-xs font-medium opacity-80">
                      • ~{formatGrams(item.estimated_weight_g)}
                    </span>
                    {item.used_in_recipe_g > 0 && (
                      <>
                        <ChefHat aria-hidden="true" className="size-4 shrink-0" />
                        <span className="sr-only">
                          , dipakai {formatGrams(item.used_in_recipe_g)} di resep
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {usedCount > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <ChefHat aria-hidden="true" className="size-3.5" />
          menandai bahan yang dipakai di resep
        </p>
      )}
    </ResultSection>
  );
}

function StatusDot({ color, pulse }: { color: string; pulse: boolean }) {
  return (
    <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
      {pulse && (
        <span
          className={`absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping ${color}`}
        />
      )}
      <span className={`relative inline-flex size-2.5 rounded-full ${color}`} />
    </span>
  );
}
