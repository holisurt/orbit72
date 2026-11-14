// Event card copy (design/HF-Ops). Effect numbers are read from events.json, not hard-coded.
import type { DonkiGst, GameEvent } from '../data/types';
import { fmt } from './format';

export function eventIntro(ev: GameEvent, ctx: { hasShield: boolean; donki: DonkiGst | null | undefined }): string {
  switch (ev.id) {
    case 'E0':
      return 'The antenna of Rồng Con-1 did not deploy after separation — this design skipped environmental testing.';
    case 'E1': {
      const rec = ctx.donki
        ? `Real NASA DONKI record: geomagnetic storm from ${formatDate(ctx.donki.startTime)}, Kp ${fmt(ctx.donki.kpIndex, ctx.donki.kpIndex % 1 ? 2 : 0)}.`
        : 'NASA DONKI record not loaded (run data_prep/fetch_donki.py).';
      return `${rec} The upper atmosphere heats up and swells: drag rises about 1.9 times on a strong storm day (FACSAT-2, 2026). Energetic particles can reboot the computer. This design ${ctx.hasShield ? 'has radiation shielding' : 'has no radiation shielding'}.`;
    }
    case 'E2': {
      const w = ev.options.find((o) => o.effect.windowH)?.effect.windowH as [number, number] | undefined;
      return `The Hòa Lạc station loses grid power${w ? ` from T0+${w[0]} h to T0+${w[1]} h` : ''}. Satellites still pick up SOS messages, but the station cannot receive them.`;
    }
    default:
      return '';
  }
}

export function optionDetail(ev: GameEvent, key: string, hasShield: boolean): string {
  const e = ev.options.find((o) => o.k === key)?.effect ?? {};
  const mask = e.maskH as [number, number] | undefined;
  switch (`${ev.id}${key}`) {
    case 'E0A':
      return mask ? `Rồng Con-1 is silent from T0+${mask[0]} h to T0+${mask[1]} h, then works again.` : '';
    case 'E0B':
      return 'Rồng Con-1 is out of the constellation for all 72 hours.';
    case 'E1A':
    case 'E1C':
      return mask ? `Radios off from T0+${mask[0]} h to T0+${mask[1]} h.` : '';
    case 'E1B':
      return hasShield
        ? 'Radiation shielding fitted → carries on as normal.'
        : 'No shielding → the computer reboots and the next pass is lost.';
    case 'E2A':
      return `No messages lost; costs ${e.costKusd}k in fuel.`;
    case 'E2B':
      return `Messages picked up during the outage arrive only after power returns (T0+${e.deferDeliveryToH} h) and a satellite passes Hà Nội.`;
    case 'E2C':
      return 'The satellite stores the messages and drops them at the Ho Chi Minh City station on its first pass after pickup.';
    default:
      return '';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  return `${d.getUTCDate()} ${mon} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}
