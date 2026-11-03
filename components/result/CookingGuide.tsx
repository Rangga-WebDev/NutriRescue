"use client";

import { useId, useState, type ReactNode } from "react";
import { ChefHat } from "../icons/phosphor";
import { Check, FlaskConical, PartyPopper, Soup, Sparkles, Timer, Utensils } from "lucide-react";
import type { RecommendedRecipe } from "../../types/nutrirescue";
import ResultSection from "./ResultSection";

interface CookingGuideProps {
  recipe: RecommendedRecipe;
}

export default function CookingGuide({ recipe }: CookingGuideProps) {
  const headingId = useId();
  const [doneSteps, setDoneSteps] = useState<ReadonlySet<number>>(() => new Set());
  const total = recipe.steps.length;
  const doneCount = doneSteps.size;

  function toggleStep(index: number) {
    setDoneSteps((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <ResultSection
      headingId={headingId}
      icon={<ChefHat weight="duotone" className="size-6" />}
      eyebrow="Panduan Memasak"
      title={recipe.title}
      description={`Untuk ${recipe.target_audience_label}`}
    >
      <ul className="flex flex-wrap gap-2">
        <MetaChip icon={<Timer className="size-4" />}>{recipe.cooking_time_minutes} menit</MetaChip>
        <MetaChip icon={<Utensils className="size-4" />}>{recipe.servings} porsi anak</MetaChip>
        <MetaChip icon={<Soup className="size-4" />}>Tekstur {recipe.texture_category}</MetaChip>
      </ul>
      {recipe.portion_guide && (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          <span className="font-semibold text-slate-900">Takaran 1 porsi:</span> {recipe.portion_guide}
        </p>
      )}

      {recipe.ingredients.length > 0 && (
        <>
          <h4 className="mt-5 text-sm font-bold text-slate-900">Bahan</h4>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200/70">
            {recipe.ingredients.map((item, index) => (
              <li
                key={`${index}-${item.name}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 text-[15px] text-slate-800">{item.name}</span>
                <span className="max-w-[60%] text-right text-sm font-semibold text-slate-600">
                  {item.amount}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {recipe.nutrient_retention_tip && (
        <TipBox
          tone="amber"
          icon={<FlaskConical className="size-5 text-amber-600" />}
          title="Sains Retensi Nutrisi"
          text={recipe.nutrient_retention_tip}
        />
      )}
      {recipe.bioavailability_booster_tip && (
        <TipBox
          tone="emerald"
          icon={<Sparkles className="size-5 text-emerald-600" />}
          title="Tips Penyerapan Gizi"
          text={recipe.bioavailability_booster_tip}
        />
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-900">Langkah memasak</h4>
        <p aria-live="polite" className="text-xs font-semibold text-slate-600">
          {doneCount}/{total} selesai
        </p>
      </div>
      <div aria-hidden="true" className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${(doneCount / total) * 100}%` }}
        />
      </div>

      <ol className="mt-3 space-y-2">
        {recipe.steps.map((step, index) => {
          const done = doneSteps.has(index);
          return (
            <li key={`${index}-${step.slice(0, 24)}`}>
              <label
                className={`flex min-h-12 cursor-pointer gap-3 rounded-2xl p-3 ring-1 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-600 ${
                  done ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleStep(index)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    done ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`pt-1 text-[15px] leading-relaxed ${
                    done ? "text-slate-500 line-through decoration-emerald-600/50" : "text-slate-800"
                  }`}
                >
                  <span className="sr-only">Langkah {index + 1}: </span>
                  {step}
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      {doneCount === total ? (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-700 p-3 text-sm font-semibold text-white motion-safe:animate-pop-in"
        >
          <PartyPopper aria-hidden="true" className="size-5 shrink-0" />
          Semua langkah selesai! Simpan ke Riwayat Dapur di bawah agar bahan yang terselamatkan
          tercatat.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">
          Ketuk langkah yang sudah selesai untuk mencentangnya.
        </p>
      )}
    </ResultSection>
  );
}

function MetaChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
      <span aria-hidden="true" className="text-emerald-700">
        {icon}
      </span>
      {children}
    </li>
  );
}

const TIP_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
} as const;

function TipBox({
  tone,
  icon,
  title,
  text,
}: {
  tone: keyof typeof TIP_TONES;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={`mt-4 flex gap-3 rounded-2xl border p-4 ${TIP_TONES[tone]}`}>
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-[15px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
