// Event card copy (design/HF-Ops). Effect numbers are read from events.json, not hard-coded.
import type { DonkiGst, GameEvent } from '../data/types';
import { fmt } from './format';

export function eventIntro(ev: GameEvent, ctx: { hasShield: boolean; donki: DonkiGst | null | undefined }): string {
  switch (ev.id) {
    case 'E0':
      return 'Ăng-ten của Rồng Con-1 chưa bung sau khi tách khỏi tên lửa — thiết kế bỏ qua thử nghiệm môi trường.';
    case 'E1': {
      const rec = ctx.donki
        ? `Bản ghi thật từ NASA DONKI: bão địa từ ngày ${formatDate(ctx.donki.startTime)}, Kp ${fmt(ctx.donki.kpIndex, ctx.donki.kpIndex % 1 ? 2 : 0)}.`
        : 'Bản ghi NASA DONKI chưa được tải (chạy data_prep/fetch_donki.py).';
      return `${rec} Khí quyển trên cao nóng lên và phình ra: lực cản tăng khoảng 1,9 lần trong ngày bão mạnh (FACSAT-2, 2026). Hạt năng lượng cao có thể làm máy tính khởi động lại. Thiết kế hiện tại ${ctx.hasShield ? 'có che chắn bức xạ' : 'không có che chắn bức xạ'}.`;
    }
    case 'E2': {
      const w = ev.options.find((o) => o.effect.windowH)?.effect.windowH as [number, number] | undefined;
      return `Lưới điện trạm Hòa Lạc mất${w ? ` từ T0+${w[0]} h đến T0+${w[1]} h` : ''}. Vệ tinh vẫn nhận tin SOS nhưng trạm không thu được.`;
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
      return mask ? `Rồng Con-1 im lặng từ T0+${mask[0]} h đến T0+${mask[1]} h rồi hoạt động lại.` : '';
    case 'E0B':
      return 'Rồng Con-1 bị loại khỏi chòm suốt 72 giờ.';
    case 'E1A':
    case 'E1C':
      return mask ? `Tắt phát sóng từ T0+${mask[0]} h đến T0+${mask[1]} h.` : '';
    case 'E1B':
      return hasShield
        ? 'Có che chắn bức xạ → tiếp tục bình thường.'
        : 'Không có che chắn → máy tính khởi động lại, mất lượt nhìn thấy kế tiếp.';
    case 'E2A':
      return `Không mất tin; tốn ${e.costKusd}k tiền dầu.`;
    case 'E2B':
      return `Tin nhận trong lúc mất điện chỉ về khi có điện (T0+${e.deferDeliveryToH} h) và vệ tinh qua Hà Nội.`;
    case 'E2C':
      return 'Vệ tinh giữ tin và thả xuống trạm TP.HCM ở lần đầu nhìn thấy sau khi nhận.';
    default:
      return '';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}
