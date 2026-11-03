import { Baby, PersonSimpleRun, PersonSimpleWalk } from "./phosphor";
import type { IconProps } from "./phosphor";
import type { AgeGroupId } from "../../lib/age-groups";

const AGE_GROUP_ICONS = {
  mpasi_6_12_bln: Baby,
  anak_1_2_thn: PersonSimpleWalk,
  anak_2_5_thn: PersonSimpleRun,
} as const satisfies Record<AgeGroupId, unknown>;

/** Ikon tahap tumbuh anak: bayi → mulai berjalan → aktif berlari. */
export default function AgeGroupIcon({ id, ...props }: IconProps & { id: AgeGroupId }) {
  const Icon = AGE_GROUP_ICONS[id];
  return <Icon aria-hidden="true" weight="duotone" {...props} />;
}
