// Part display copy from design/HF-Build (abbreviation + "why" text). Numbers come from data/sim.
import type { Part, PartCat } from '../data/types';
import { downlinkBytesPerDay, linkMarginFor, type LinkId } from '../sim/link';
import { fmt } from './format';

export const CAT_COLOR: Record<PartCat, string> = {
  bus: '#3DD6F5',
  pow: '#4ADE80',
  com: '#A78BFA',
  pay: '#F5A524',
  ext: '#94A3B8',
};

export const CAT_TABS: { id: PartCat; name: string }[] = [
  { id: 'bus', name: 'Máy tính' },
  { id: 'pow', name: 'Nguồn' },
  { id: 'com', name: 'Liên lạc' },
  { id: 'pay', name: 'Payload' },
  { id: 'ext', name: 'Phụ trợ' },
];

/**
 * Downlink per day at the given contact minutes — same rule as the HUD Data bar
 * (2 decimals below 10 MB, else integer). E.g. "≈ 250 MB/ngày với 16,7 phút liên lạc".
 */
export function downlinkText(rbps: number, contactMinPerDay: number): string {
  const mb = downlinkBytesPerDay(rbps, contactMinPerDay) / 1e6;
  const min = Number.isInteger(contactMinPerDay) ? fmt(contactMinPerDay, 0) : fmt(contactMinPerDay, 1);
  return `≈ ${fmt(mb, mb < 10 ? 2 : 0)} MB/ngày với ${min} phút liên lạc`;
}

/** Parts whose card shows a link margin, and the link they use. */
export const PART_LINK: Partial<Record<string, LinkId>> = { uhf: 'uhf', sband: 's', sos: 'sos' };

/**
 * Detail-card text for a part. "{dl}" → computed downlink; "{m}" → link margin to Hoa Lac at the current
 * altitude and minimum elevation, from the same function as the Orbit screen's R7 panel.
 */
export function partWhy(p: Part, contactMinPerDay: number, hKm: number, elevDeg: number): string {
  let why = PART_INFO[p.id]?.why ?? '';
  if (p.rbps) why = why.replace('{dl}', downlinkText(p.rbps, contactMinPerDay));
  const link = PART_LINK[p.id];
  if (link) why = why.replace('{m}', `${fmt(linkMarginFor(link, hKm, elevDeg), 1)} dB ở ${fmt(hKm, 0)} km, góc ngẩng ${fmt(elevDeg, 0)}°`);
  return why;
}

export const PART_INFO: Record<string, { ab: string; why: string }> = {
  obc: { ab: 'OBC', why: 'Máy tính chính: chạy phần mềm bay, lưu tin SOS chờ tải xuống.' },
  obc2: { ab: 'AI', why: 'Xử lý ảnh ngay trên vệ tinh: dữ liệu camera còn 40%.' },
  adcs: { ab: 'ADC', why: 'Giữ hướng bằng từ trường Trái Đất, trỏ khoảng 10° — đủ cho UHF, S-band, SOS.' },
  adcs2: { ab: 'ADC+', why: 'Trỏ dưới 0,1°; bắt buộc nếu có camera hoặc X-band.' },
  eps: { ab: 'EPS', why: 'Quản lý điện và nuôi vệ tinh khoảng 36 phút trong bóng Trái Đất mỗi vòng.' },
  bat: { ab: 'BAT', why: 'Thêm dung lượng khi tải lớn.' },
  uhf: {
    ab: 'UHF',
    why: 'Phát 1 W, dipole 0 dBi. Biên tới Hòa Lạc {m} — thông, nhưng chỉ {dl}.',
  },
  sband: {
    ab: 'S',
    why: 'Phát 2 W, patch 6 dBi; trạm dùng chảo 3 m. Biên {m}; {dl}.',
  },
  xband: { ab: 'X', why: 'Rất nhanh, cần ADCS chính xác. Link budget chỉ có ở Sandbox.' },
  sos: { ab: 'SOS', why: 'Nhận tin 300 bps từ máy cầm tay 0,5 W (biên {m}). Tạo 5 MB/ngày.' },
  ais: { ab: 'AIS', why: 'Theo dõi tàu cá trên biển — như NanoDragon.' },
  cam: { ab: 'CAM', why: '5 W khi chụp, 10% thời gian. 2.000 MB/ngày; vô dụng khi mây dày.' },
  sail: { ab: 'SAIL', why: 'Bung 0,5 m² khi hết nhiệm vụ: tồn lưu = (L − 3) × 0,047 / 0,547.' },
  prop: { ab: 'PRP', why: 'Né mảnh vỡ (sự cố E4); 10 W chỉ khi đẩy.' },
  shield: { ab: 'SH', why: 'Miễn nhiễm mất lượt do bão Mặt Trời (E1-B).' },
};
