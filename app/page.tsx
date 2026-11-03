import { Baby, Camera, CookingPot } from "../components/icons/phosphor";
import Image from "next/image";
import FoodWasteCounter from "../components/history/FoodWasteCounter";
import PantryScanner from "../components/scanner/PantryScanner";

const FLOW_STEPS = [
  { Icon: Camera, label: "Foto bahan" },
  { Icon: Baby, label: "Pilih usia" },
  { Icon: CookingPot, label: "Resep bergizi" },
];

export default function Home() {
  return (
    <>
      <header className="relative overflow-hidden bg-linear-to-br from-emerald-700 to-emerald-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-amber-300/20 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-xl px-4 pb-16 pt-5 lg:max-w-6xl lg:px-8 lg:pb-20 lg:pt-8">
          <p>
            <Image
              src="/brand/nutrirescue-logo-white.svg"
              alt="NutriRescue"
              width={1393}
              height={294}
              preload
              className="block h-9 w-auto lg:h-10"
            />
          </p>

          <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <h1 className="mt-6 text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
                Sisa bahan dapur jadi menu{" "}
                <span className="text-amber-300">cegah stunting</span>
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-emerald-50">
                Foto bahan di dapur atau kulkas, pilih usia si kecil, lalu
                NutriRescue meracik resep bergizi seimbang dalam hitungan detik.
              </p>

              <ol
                aria-label="Cara kerja"
                className="mt-4 hidden flex-wrap items-center gap-2 text-sm font-semibold sm:flex"
              >
                {FLOW_STEPS.map((step, index) => (
                  <li
                    key={step.label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 py-1 pl-1 pr-3 ring-1 ring-white/20"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-800">
                      {index + 1}
                    </span>
                    <step.Icon aria-hidden="true" weight="duotone" className="size-4.5 text-amber-300" />
                    {step.label}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-5 lg:mt-0 lg:w-96 lg:shrink-0">
              <FoodWasteCounter />
            </div>
          </div>
        </div>
      </header>

      <main className="relative -mt-10 flex-1 pb-8 lg:-mt-12 lg:pb-12">
        <PantryScanner />
      </main>

      <footer className="flex flex-col items-center gap-2 px-4 pb-6 text-center text-xs text-slate-500">
        <Image
          src="/brand/nutrirescue-logo.svg"
          alt="NutriRescue"
          width={1393}
          height={294}
          className="h-7 w-auto"
        />
        <p>Selamatkan pangan, cegah stunting</p>
      </footer>
    </>
  );
}
