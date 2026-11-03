export type AgeGroupId = "mpasi_6_12_bln" | "anak_1_2_thn" | "anak_2_5_thn";

export interface AgeGroup {
  id: AgeGroupId;
  stage: string;
  range: string;
  texture: string;
  focus: string;
}

export const AGE_GROUPS: Record<AgeGroupId, AgeGroup> = {
  mpasi_6_12_bln: {
    id: "mpasi_6_12_bln",
    stage: "MPASI",
    range: "6–12 bulan",
    texture: "Lumat hingga cincang halus",
    focus: "Kaya zat besi & lemak sehat, tanpa tambahan gula dan garam.",
  },
  anak_1_2_thn: {
    id: "anak_1_2_thn",
    stage: "Batita",
    range: "1–2 tahun",
    texture: "Cincang kasar & lunak",
    focus: "Masa emas 1000 HPK: utamakan protein hewani untuk kejar tumbuh.",
  },
  anak_2_5_thn: {
    id: "anak_2_5_thn",
    stage: "Balita",
    range: "2–5 tahun",
    texture: "Potongan kecil & empuk (menu keluarga)",
    focus: "Gizi seimbang dengan protein & kalsium untuk tinggi badan optimal.",
  },
};

export const AGE_GROUP_LIST: AgeGroup[] = Object.values(AGE_GROUPS);

export const DEFAULT_AGE_GROUP_ID: AgeGroupId = "anak_1_2_thn";

export function isAgeGroupId(value: unknown): value is AgeGroupId {
  return typeof value === "string" && Object.hasOwn(AGE_GROUPS, value);
}
