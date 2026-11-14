// Part display copy from design/HF-Build (abbreviation + "why" text). Numbers come from data/sim.
import type { Part, PartCat } from '../data/types';
import { downlinkBytesPerDay } from '../sim/link';
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

/** Detail-card text for a part; "{dl}" is replaced by its computed downlink. */
export function partWhy(p: Part, contactMinPerDay: number): string {
  const why = PART_INFO[p.id]?.why ?? '';
  return p.rbps ? why.replace('{dl}', downlinkText(p.rbps, contactMinPerDay)) : why;
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
    why: 'Phát 1 W, dipole 0 dBi. Biên tới Hòa Lạc 9,7 dB ở góc ngẩng 10° — thông, nhưng chỉ {dl}.',
  },
  sband: {
    ab: 'S',
    why: 'Phát 2 W, patch 6 dBi; trạm dùng chảo 3 m. Biên 8,4 dB; {dl}.',
  },
  xband: { ab: 'X', why: 'Rất nhanh, cần ADCS chính xác. Link budget chỉ có ở Sandbox.' },
  sos: { ab: 'SOS', why: 'Nhận tin 300 bps từ máy cầm tay 0,5 W (biên 9,3 dB). Tạo 5 MB/ngày.' },
  ais: { ab: 'AIS', why: 'Theo dõi tàu cá trên biển — như NanoDragon.' },
  cam: { ab: 'CAM', why: '5 W khi chụp, 10% thời gian. 2.000 MB/ngày; vô dụng khi mây dày.' },
  sail: { ab: 'SAIL', why: 'Bung 0,5 m² khi hết nhiệm vụ: tồn lưu = (L − 3) × 0,047 / 0,547.' },
  prop: { ab: 'PRP', why: 'Né mảnh vỡ (sự cố E4); 10 W chỉ khi đẩy.' },
  shield: { ab: 'SH', why: 'Miễn nhiễm mất lượt do bão Mặt Trời (E1-B).' },
};
