"use client";

import { useId } from "react";
import { CircleCheck, CookingPot, Target } from "lucide-react";
import {
  AGE_GROUP_LIST,
  AGE_GROUPS,
  type AgeGroupId,
} from "../../lib/age-groups";
import AgeGroupIcon from "../icons/AgeGroupIcon";

interface AgeGroupSelectorProps {
  value: AgeGroupId;
  onChange: (value: AgeGroupId) => void;
  labelledBy: string;
}

export default function AgeGroupSelector({
  value,
  onChange,
  labelledBy,
}: AgeGroupSelectorProps) {
  const radioName = useId();
  const selected = AGE_GROUPS[value];

  return (
    <div className="mt-4">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="grid grid-cols-3 gap-2"
      >
        {AGE_GROUP_LIST.map((group) => {
          const isSelected = group.id === value;
          return (
            <label
              key={group.id}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-1.5 py-3 text-center transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-600 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
              }`}
            >
              <input
                type="radio"
                name={radioName}
                value={group.id}
                checked={isSelected}
                onChange={() => onChange(group.id)}
                className="sr-only"
              />
              {isSelected && (
                <CircleCheck
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 size-4 text-emerald-600"
                />
              )}
              <AgeGroupIcon
                id={group.id}
                className={`size-9 transition-colors ${
                  isSelected ? "text-emerald-700" : "text-slate-500"
                }`}
              />
              <span className="mt-2 text-sm font-extrabold text-slate-900">
                {group.stage}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {group.range}
              </span>
            </label>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className="mt-3 space-y-1.5 rounded-2xl bg-emerald-50/70 p-3 text-sm leading-relaxed text-emerald-950 ring-1 ring-emerald-100"
      >
        <p className="flex gap-2">
          <CookingPot
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-emerald-600"
          />
          <span>
            <span className="font-semibold">Tekstur:</span> {selected.texture}
          </span>
        </p>
        <p className="flex gap-2">
          <Target
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-emerald-600"
          />
          <span>
            <span className="font-semibold">Fokus gizi:</span> {selected.focus}
          </span>
        </p>
      </div>
    </div>
  );
}
