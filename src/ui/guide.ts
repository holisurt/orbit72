// Guide (Sổ tay) content, ported from design/HF-Guide.dc.html. Numbers are computed from the sim and the data
// files (never typed in), so the Guide always matches what the game uses.
import type { GameData } from '../data/types';
import { DEG, coverageRadiusKm, eclipseFraction, eclipseHours, periodMin, raanRate, slantRangeKm, ssoInclinationDeg } from '../sim/orbit';
import { BODY_FILL, CELL_EFF, DOD, POWER_LOSS, SOLAR_CONST, bodyPowerW, wingPowerW } from '../sim/power';
import { LINKS, fsplDb, linkMarginDb } from '../sim/link';
import { INTEGRATION_MONTHS } from '../sim/build';
import { REPLACEMENT_MONTHS } from '../sim/launch';
import { CML_TEXT, MIN_IMAGING_PASSES } from '../sim/score';
import { E3_WINDOW } from '../state/run';
import { fmt } from './format';
import { IMERG_LABEL } from './rain';

export interface GuideItem {
  t: string; // title
  d: string; // body
  s: string; // source / tag line
  mono?: boolean;
  link?: { href: string; text: string }[];
}

export interface GuideTab {
  id: 'terms' | 'formulas' | 'science' | 'dragon' | 'sources';
  n: string; // tab name
  head: string;
  tip: string;
  items: GuideItem[];
}

const H = 520; // worked examples at the S1 altitude

export const IMERG_DOI = 'https://doi.org/10.5067/GPM/IMERG/3B-HH/07';
export const IMERG_CATALOG =
  'https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698';

export function guideTabs(data: GameData): GuideTab[] {
  const req = data.scenario.requirements;
  const eps = req.elevationDeg;
  const fEcl = eclipseFraction(H);
  const c6 = data.components.chassis.find((c) => c.id === '6U')!;
  const wings = data.components.wings;
  const sail = data.components.parts.find((p) => p.sailAreaM2);
  const d10 = slantRangeKm(H, eps);
  const incl = ssoInclinationDeg(H);
  const raanDegDay = (raanRate(H, incl) / DEG) * 86400;
  const diff = data.scenario.difficulty;
  const iss = data.launchers.launchers.find((l) => l.id === 'iss');
  const ride = data.launchers.launchers.find((l) => l.id === 'rideshare');
  const dedicated = data.launchers.launchers.find((l) => l.id === 'dedicated');
  const station = (id: keyof typeof LINKS, what: string) => {
    const l = LINKS[id];
    return {
      t: `Trạm Hòa Lạc · ${l.label}`,
      d: `${what}: ${fmt(l.fMHz, 0)} MHz, phát ${fmt(l.pW, 1)} W, G_tx ${fmt(l.gTx, 0)} dBi, G_rx ${fmt(l.gRx, 1)} dBi, T_sys ${fmt(l.tSysK, 0)} K, suy hao khác ${fmt(l.lMisc, 0)} dB, cần Eb/N0 ${fmt(l.reqDb, 1)} dB → biên ${fmt(linkMarginDb(l, H, eps), 1)} dB ở ${H} km, ${eps}°.`,
      s: '[GA] thông số trạm điển hình · công thức [CT]',
    };
  };

  return [
    {
      id: 'terms',
      n: 'Thuật ngữ',
      head: 'Thuật ngữ cơ bản',
      tip: 'Đọc trước khi ráp vệ tinh!',
      items: [
        {
          t: 'Bốn phân đoạn sứ mệnh',
          d: 'Launch = tên lửa · Space = vệ tinh · Ground = trạm Hòa Lạc · User = trung tâm cứu hộ và các xã SOS. Mỗi màn chơi là một phân đoạn: chọn tên lửa, ráp CubeSat, kiểm tra đường truyền tới trạm, và chấm điểm theo tin SOS đến tay người cứu hộ.',
          s: 'Design and Develop Science Missions (NASA)',
        },
        {
          t: 'Huy hiệu CML · Concept Maturity Level',
          d: `Thang độ chín của ý tưởng sứ mệnh do JPL dùng. Trong game: CML1 ${CML_TEXT[1].toLowerCase()} · CML2 ${CML_TEXT[2].toLowerCase()} · CML3 ${CML_TEXT[3].toLowerCase()} · CML4 ${CML_TEXT[4].toLowerCase()}. Mỗi mức chỉ tính khi đã đạt mọi mức thấp hơn.`,
          s: 'NASA JPL · hiện ở màn Báo cáo',
        },
        {
          t: 'Mặt phẳng quỹ đạo · Orbital plane',
          d: 'Vệ tinh cùng mặt phẳng qua Hà Nội cùng khung giờ — muốn phủ cả ngày phải rải nhiều mặt phẳng.',
          s: 'Màn Quỹ đạo',
        },
        {
          t: 'SSO · Sun-synchronous orbit',
          d: `Qua mỗi nơi vào cùng giờ địa phương; ≈ ${fmt(incl, 1)}° ở ${H} km.`,
          s: 'Màn Quỹ đạo',
        },
        { t: 'Bóng tối · Eclipse', d: `≈ ${fmt(fEcl * 100, 1)}% mỗi vòng ở ${H} km: vệ tinh sống nhờ pin.`, s: 'Màn Ráp vệ tinh' },
        { t: 'Store-and-forward', d: 'Nhận tin khi bay qua vùng bão, lưu lại, gửi xuống khi qua trạm.', s: 'Mission Control' },
        {
          t: 'Biên đường truyền · Link margin',
          d: `Phần tín hiệu dư so với mức tối thiểu; ≥ ${fmt(req.linkMarginDb, 0)} dB là thông.`,
          s: 'Màn Quỹ đạo · yêu cầu R7',
        },
        {
          t: 'Tồn lưu sau nhiệm vụ',
          d: `Tuổi thọ quỹ đạo trừ thời gian vận hành (${data.scenario.opsYears} năm); quy định FCC: ≤ ${fmt(req.residualMaxY, 0)} năm.`,
          s: 'Yêu cầu R4',
        },
        {
          t: 'P1h và P1h_mưa',
          d: 'P1h = phần trăm thời gian mà tin SOS gửi lúc đó được nhận trong ≤ 1 giờ. P1h_mưa đặt trọng số lớn hơn cho các giờ mưa to (dữ liệu IMERG).',
          s: 'Mission Control · sao 2 và sao 3',
        },
      ],
    },
    {
      id: 'formulas',
      n: 'Công thức',
      head: `Công thức trong game (ví dụ ${H} km)`,
      tip: 'Mọi số trong game tính từ đây.',
      items: [
        { t: 'Chu kỳ', d: `T = 2π√(a³/μ) → ${fmt(periodMin(H), 1)} phút`, s: '[CT]', mono: true },
        { t: 'Bóng tối', d: `f = arccos(√(h²+2R⊕h)/a)/π → ${fmt(fEcl * 100, 1)}% · ${fmt(eclipseHours(H) * 60, 0)} phút`, s: '[CT] β = 0', mono: true },
        { t: 'Nghiêng SSO', d: `cos i = −2·Ω̇☉·a² / (3·J2·R⊕²·n) → ${fmt(incl, 2)}°`, s: '[CT]', mono: true },
        {
          t: 'Vùng nhìn thấy trạm',
          d: `λ = arccos(R⊕cos ε/a) − ε, ε = ${eps}° → bán kính ${fmt(coverageRadiusKm(H, eps), 0)} km`,
          s: '[CT]',
          mono: true,
        },
        { t: 'Trôi nút do J2', d: `Ω̇ = −1,5·J2·(R⊕/a)²·n·cos i → ${fmt(raanDegDay, 3)}°/ngày`, s: '[CT]', mono: true },
        {
          t: 'Suy hao đường truyền',
          d: `FSPL = 20log d + 20log f + 32,44 → d = ${fmt(d10, 0)} km: UHF ${fmt(fsplDb(d10, LINKS.uhf.fMHz), 1)} dB · S ${fmt(fsplDb(d10, LINKS.s.fMHz), 1)} dB`,
          s: '[CT] d km, f MHz',
          mono: true,
        },
        {
          t: 'Biên đường truyền',
          d: 'Eb/N0 = EIRP − FSPL − L + (G_rx − 10log T_sys) + 228,6 − 10log R_b; biên = Eb/N0 − yêu cầu',
          s: '[CT] thông số trạm [GA]',
          mono: true,
        },
        {
          t: 'Điện sinh',
          d: `${fmt(SOLAR_CONST, 0)}·${fmt(CELL_EFF, 2)}·${fmt(BODY_FILL, 1)}·(A/4)·(1−f)·${fmt(POWER_LOSS, 2)} → 6U: ${fmt(bodyPowerW(c6.areaM2, fEcl), 1)} W · cánh +${fmt(wingPowerW(wings.areaM2, wings.orientation, fEcl), 1)} W`,
          s: 'S [CT]; η, k [GA]',
          mono: true,
        },
        { t: 'Pin cần', d: `P_dùng × t_tối / ${fmt(DOD, 1)} (độ xả sâu)`, s: '[GA] DoD', mono: true },
        {
          t: 'Trọng số mưa',
          d: 'w(h) = 1 + R(h)/R̄ ; P1h_mưa = Σ w·ok / Σ w',
          s: `R = mưa IMERG trung bình ${data.scenario.rainBox.lonMin}–${data.scenario.rainBox.lonMax}°E, ${data.scenario.rainBox.latMin}–${data.scenario.rainBox.latMax}°N`,
          mono: true,
        },
        { t: 'Giá trị đồng tiền (sao 3)', d: 'VFM = P1h_mưa (%) / chi phí (triệu USD)', s: 'Chi phí thiết kế, không tính sự cố', mono: true },
      ],
    },
    {
      id: 'science',
      n: 'Science · giả định',
      head: 'Mô hình đơn giản hóa ở đâu (Science) — mọi giả định [GA]',
      tip: 'Nói rõ giới hạn là làm khoa học đúng cách.',
      items: [
        { t: 'Quỹ đạo tròn, 2 vật thể + J2', d: 'Bỏ qua lực cản trong 72 giờ, nhiễu Mặt Trăng, Mặt Trời.', s: 'Sai số nhỏ trong 72 h' },
        { t: 'Bent-pipe Hà Nội ≈ Hòa Lạc', d: 'Trạm cách Hà Nội ~30 km nên coi như cùng một điểm nhìn.', s: 'Xấp xỉ hình học' },
        { t: 'Bóng tối xấu nhất β = 0', d: 'Thực tế thay đổi theo mùa; game chọn trường hợp khó nhất.', s: 'Thiết kế an toàn' },
        { t: 'Góc ngẩng tối thiểu', d: `Trạm chỉ liên lạc khi vệ tinh cao hơn ${eps}° trên đường chân trời.`, s: '[GA]' },
        station('uhf', 'Ăng-ten Yagi'),
        station('s', 'Chảo S-band 3 m'),
        station('sos', 'Máy cầm tay của người dân → vệ tinh'),
        {
          t: 'Pin mặt trời',
          d: `Hiệu suất η = ${fmt(CELL_EFF, 2)}, hệ số phủ thân ${fmt(BODY_FILL, 1)}, tổn hao hệ thống ${fmt(POWER_LOSS, 2)}; cánh ${fmt(wings.areaM2, 3)} m² với hệ số hướng ${fmt(wings.orientation, 1)}.`,
          s: '[GA]',
        },
        { t: 'Pin và dư công suất', d: `Độ xả sâu ${fmt(req.dod, 1)}; cần P_sinh ≥ ${fmt(req.powerMargin, 1)} × P_dùng.`, s: '[GA] · R3' },
        {
          t: 'Khung CubeSat',
          d: data.components.chassis
            .map((c) => `${c.id}: ${c.cells} ô, ${fmt(c.baseKg, 1)}/${fmt(c.limitKg, 0)} kg, ${fmt(c.kusd, 0)}k, ${c.months} tháng`)
            .join(' · '),
          s: '[GA] theo CubeSat Design Spec',
        },
        {
          t: 'Giá, linh kiện, thời gian',
          d: `Giá và thông số linh kiện là giá trị cân bằng game, đối chiếu NASA Small Spacecraft SOA 2026; tích hợp +${INTEGRATION_MONTHS} tháng, thử môi trường +${data.components.envTest.kusd}k / +${data.components.envTest.months} tháng.`,
          s: '[GA]',
        },
        {
          t: 'Tên lửa',
          d: `${ride?.name ?? 'Rideshare'}: ${ride?.price?.baseKusd ?? '—'}k/chuyến ≤ ${ride?.price?.baseKg ?? '—'} kg [NG] · ${iss?.name ?? 'ISS'}: ${iss?.pricePerSatKusd ?? '—'}k/vệ tinh [GA] · ${dedicated?.name ?? 'Riêng'}: ${fmt(dedicated?.pricePerLaunchKusd ?? NaN, 0)}k [NG]. Phóng hỏng (Giám đốc) ${fmt(diff.giam_doc.launchFail * 100, 0)}%/chuyến, chuyến thay +${REPLACEMENT_MONTHS} tháng.`,
          s: '[GA] rủi ro phóng',
        },
        {
          t: 'Cánh hãm',
          d: `Bung ${fmt(sail?.sailAreaM2 ?? NaN, 1)} m² khi hết ${data.scenario.opsYears} năm vận hành; tồn lưu giảm theo tỉ lệ diện tích thân / (thân + cánh).`,
          s: '[GA] diện tích cánh',
        },
        { t: 'Mốc T0', d: 'T0 = lúc bão đổ bộ ≈ 14:00 ngày 7/9/2024 giờ Việt Nam; vận hành T0 → T0 + 72 h.', s: '[GA] gần đúng' },
        {
          t: 'Mây che camera',
          d: `Coi là có mây khi mưa ô Hà Nội ≥ ${fmt(data.scenario.cloudRainThresholdMmH, 1)} mm/h (IMERG); sự cố E3 phủ mây T0+${E3_WINDOW[0]} → ${E3_WINDOW[1]} h. Lượt chụp hợp lệ 06:00–18:00; cần ≥ ${MIN_IMAGING_PASSES} lượt.`,
          s: '[GA]',
        },
        {
          t: 'Độ khó',
          d: (['hoc_vien', 'ky_su', 'giam_doc'] as const)
            .map((k) => `${{ hoc_vien: 'Học viên', ky_su: 'Kỹ sư', giam_doc: 'Giám đốc' }[k]}: ${fmt(diff[k].budget, 0)}k, R1 ≤ ${fmt(diff[k].gapMaxH, 1)} h, sự cố ${diff[k].events.join(', ')}`)
            .join(' · '),
          s: '[GA] · E0 chỉ khi bỏ thử môi trường',
        },
        {
          t: 'Ngưỡng chấm',
          d: 'ĐẠT ≤ 80% giới hạn · SÁT 80–100% · VƯỢT > 100%; so sánh trên số đã làm tròn như hiển thị. Ngưỡng sao và hiệu ứng thẻ sự cố là giá trị cân bằng game.',
          s: '[GA]',
        },
      ],
    },
    {
      id: 'dragon',
      n: 'Hồ sơ Rồng',
      head: 'Chuyện có thật',
      tip: 'Mỗi thẻ sự cố đều có gốc thật.',
      items: [
        { t: 'NanoDragon · 2021', d: 'CubeSat 3U, 3,8 kg, AIS, SSO ~560 km; mất liên lạc sau phóng.', s: 'Bài học: liên lạc dự phòng' },
        { t: 'LOTUSat-1', d: 'Vệ tinh radar ~600 kg; lùi lịch phóng sang năm tài chính 2027 vì sự cố thử động cơ Epsilon.', s: 'Bài học: rủi ro hoãn phóng' },
        { t: 'FACSAT-2 · 2023–2025', d: '6U dự kiến sống ≥ 5 năm, rơi sau 926 ngày vì chu kỳ Mặt Trời mạnh hơn dự báo.', s: 'Lý do có bảng “Mặt Trời cực đại”' },
        { t: 'Bão Yagi · 9/2024', d: '6.285 trạm phát sóng mất liên lạc do mất điện ở 15 tỉnh, thành.', s: 'Động lực của 72 Giờ Vàng' },
        { t: 'PicoDragon · 2013', d: 'Vệ tinh ~1 kg thả từ Trạm Vũ trụ Quốc tế.', s: 'Gợi ý lớp “Thang Máy ISS”' },
        { t: 'Bão từ mạnh', d: 'Lực cản khí quyển tăng ~1,9 lần trong ngày bão mạnh.', s: 'Thẻ sự cố E1' },
      ],
    },
    {
      id: 'sources',
      n: 'Nguồn',
      head: 'Nguồn dữ liệu và ghi công',
      tip: 'Không dùng logo NASA ở bất kỳ đâu.',
      items: [
        {
          t: IMERG_LABEL,
          d: 'Lượng mưa từng giờ trên miền Bắc 7–10/9/2024 (chỉ bản Final Run): trọng số P1h_mưa, bản đồ mưa 72 giờ ở màn Nhiệm vụ, lớp mưa Mission Control.',
          s: 'GPM_3IMERGHH v07 · NASA GES DISC',
          link: [
            { href: IMERG_DOI, text: 'DOI 10.5067/GPM/IMERG/3B-HH/07' },
            { href: IMERG_CATALOG, text: 'data.nasa.gov' },
          ],
        },
        {
          t: 'NASA DONKI',
          d: data.donki
            ? `Bản ghi bão địa từ thật cho thẻ sự cố E1 (${data.donki.gstID ?? data.donki.startTime}, Kp ${fmt(data.donki.kpIndex, data.donki.kpIndex % 1 ? 2 : 0)}).`
            : 'Bản ghi bão địa từ thật cho thẻ sự cố E1.',
          s: 'CCMC · Space Weather Database Of Notifications, Knowledge, Information',
          link: data.donki?.link ? [{ href: data.donki.link, text: 'Bản ghi GST' }] : undefined,
        },
        { t: 'NASA Small Spacecraft SOA 2026', d: 'Khoảng thông số linh kiện; quy tắc rời quỹ đạo.', s: 'NASA Ames · Small Spacecraft Systems Virtual Institute' },
        {
          t: 'Tài nguyên thử thách (Space Apps 2026)',
          d: 'Design and Develop Science Missions · GMAT (General Mission Analysis Tool) · JPL Concept Maturity Levels · Mission Design Lab · NASA Mission Viz · trò chơi học về kính thiên văn của NASA · CubeSat 101 · thử thách VR Space Apps 2023 · trò chơi số của CSA (Cơ quan Vũ trụ Canada).',
          s: 'Phương pháp và công cụ, không phải số liệu · CREDITS.md',
        },
        {
          t: 'arXiv:2609.24534 (2026)',
          d: 'Bảng tuổi thọ CubeSat 6U (FACSAT-2), J2, hệ số lực cản ×1,92 khi bão từ.',
          s: 'Vargas Domínguez et al.',
          link: [{ href: 'https://arxiv.org/abs/2609.24534', text: 'arxiv.org/abs/2609.24534' }],
        },
        {
          t: 'Natural Earth',
          d: 'Đường bờ biển, biên giới cho bản đồ và quả địa cầu.',
          s: 'Public domain',
          link: [{ href: 'https://www.naturalearthdata.com/', text: 'naturalearthdata.com' }],
        },
        { t: 'Bộ TT&TT qua VnEconomy', d: 'Số trạm phát sóng mất liên lạc do bão Yagi.', s: '13/9/2024' },
        {
          t: 'Quy định và giá phóng',
          d: 'FCC 22-74 (quy tắc rời quỹ đạo 5 năm) · CubeSat Design Specification (Cal Poly) · giá rideshare 2026 (New Space Economy) · Quyết định 1131/QĐ-TTg (2025), 21/2026/QĐ-TTg.',
          s: '[NG] SPEC §11',
        },
        { t: 'Font và hình vẽ', d: 'Be Vietnam Pro, IBM Plex Mono (SIL OFL 1.1); mascot, vệ tinh, patch vẽ gốc.', s: 'CREDITS.md' },
      ],
    },
  ];
}
