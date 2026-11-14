// Co-op roles and priority cards — SPEC §8, text from design/HF-Setup.
import type { CardSide, PlayerCount, RoleId } from './store';

export interface RoleInfo {
  id: RoleId;
  name: string;
  ab: string;
  color: string;
  duty: string;
  cards: Record<CardSide, string>;
}

export const ROLES: Record<RoleId, RoleInfo> = {
  FD: {
    id: 'FD',
    name: 'Flight Director',
    ab: 'FD',
    color: '#A78BFA',
    duty: 'Ngân sách, lịch, quyết định cuối, xử lý sự cố, gọi Go/No-Go.',
    cards: { a: 'Chi phí ≤ 90% ngân sách', b: 'Dự phòng ≥ 200k' },
  },
  VT: {
    id: 'VT',
    name: 'Kỹ sư Vệ tinh',
    ab: 'VT',
    color: '#4ADE80',
    duty: 'Khung, nguồn điện, pin, khối lượng, thử nghiệm.',
    cards: { a: 'Dư công suất ≥ 20%', b: 'Có thử nghiệm môi trường' },
  },
  KH: {
    id: 'KH',
    name: 'Nhà Khoa học',
    ab: 'KH',
    color: '#F5A524',
    duty: 'Payload SOS, camera, giá trị cứu hộ.',
    cards: { a: '≥ 2 payload', b: 'P1h ≥ 55%' },
  },
  QD: {
    id: 'QD',
    name: 'Kỹ sư Quỹ đạo & Liên lạc',
    ab: 'QĐ',
    color: '#3DD6F5',
    duty: 'Độ nghiêng, độ cao, mặt phẳng, tên lửa, đường truyền.',
    cards: { a: 'Khoảng trống ≤ 3,0 giờ', b: 'Mọi biên đường truyền ≥ 6 dB' },
  },
};

/** Players → roles (SPEC §8). */
export const ROLE_GROUPS: Record<PlayerCount, RoleId[][]> = {
  4: [['FD'], ['VT'], ['KH'], ['QD']],
  3: [['FD'], ['VT', 'KH'], ['QD']],
  2: [['FD', 'QD'], ['VT', 'KH']],
};

export function playerForRole(count: PlayerCount, role: RoleId): number {
  return ROLE_GROUPS[count].findIndex((g) => g.includes(role));
}

export function dealCards(rand: () => number = Math.random): Record<RoleId, CardSide> {
  const pick = (): CardSide => (rand() < 0.5 ? 'a' : 'b');
  return { FD: pick(), VT: pick(), KH: pick(), QD: pick() };
}
