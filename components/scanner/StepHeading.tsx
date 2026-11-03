import type { Ref } from "react";

interface StepHeadingProps {
  id: string;
  step: number;
  title: string;
  description: string;
  ref?: Ref<HTMLHeadingElement>;
}

export default function StepHeading({
  id,
  step,
  title,
  description,
  ref,
}: StepHeadingProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white"
      >
        {step}
      </span>
      <div>
        {/* tabIndex -1 agar fokus bisa dipindahkan ke judul ini secara terprogram. */}
        <h2
          ref={ref}
          id={id}
          tabIndex={-1}
          className="text-base font-bold text-slate-900 focus:outline-none"
        >
          <span className="sr-only">Langkah {step}: </span>
          {title}
        </h2>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}
