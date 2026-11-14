// Plain-language labels for students (formulas unchanged; internal names stay p1h / p1hRain / vfm).
export const L_P1H = 'Tin SOS tới nơi trong 1 giờ';
export const L_P1H_RAIN = 'Tin SOS tới nơi trong 1 giờ (tính theo mưa NASA IMERG)';
export const L_VFM = 'Hiệu quả chi phí';

export type TermId = 'incl' | 'plane' | 'eclipse' | 'margin' | 'lifetime' | 'cml' | 'p1h';

/** One-sentence explanation + the Guide card it links to (tab index, card title). */
export const TERMS: Record<TermId, { text: string; tab: number; card: string }> = {
  incl: {
    text: 'Góc nghiêng của đường bay so với đường xích đạo — nghiêng càng nhiều, vệ tinh càng bay lên gần hai cực.',
    tab: 0,
    card: 'Độ nghiêng · Inclination',
  },
  plane: {
    text: 'Một “vòng đường bay” quanh Trái Đất; vệ tinh cùng vòng qua Hà Nội cùng giờ, nên muốn phủ cả ngày cần nhiều vòng khác nhau.',
    tab: 0,
    card: 'Mặt phẳng quỹ đạo · Orbital plane',
  },
  eclipse: {
    text: 'Phần mỗi vòng bay vệ tinh nằm sau Trái Đất, không có nắng, nên phải sống bằng pin.',
    tab: 0,
    card: 'Bóng tối · Eclipse',
  },
  margin: {
    text: 'Tín hiệu mạnh hơn mức tối thiểu bao nhiêu dB; còn dư từ 3 dB trở lên là trạm nghe rõ.',
    tab: 0,
    card: 'Biên đường truyền · Link margin',
  },
  lifetime: {
    text: 'Số năm vệ tinh còn bay trước khi lớp khí quyển mỏng kéo nó rơi xuống và cháy.',
    tab: 0,
    card: 'Tuổi thọ quỹ đạo',
  },
  cml: {
    text: 'Thang đo ý tưởng sứ mệnh đã “chín” tới đâu: từ nhận hợp đồng (CML 1) tới phóng đạt mọi yêu cầu và có hồ sơ (CML 4).',
    tab: 0,
    card: 'Huy hiệu CML · Concept Maturity Level',
  },
  p1h: {
    text: 'Phần trăm thời gian mà một tin SOS gửi lúc đó tới được trạm trong vòng 1 giờ.',
    tab: 0,
    card: 'Tin SOS tới nơi trong 1 giờ',
  },
};
