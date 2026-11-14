// Menu labels and buttons (VI/EN). Body text, data, science copy and status chips (ĐẠT/SÁT/VƯỢT) stay Vietnamese.
import { useSettings } from '../state/settings';

export const DICT = {
  // header tools + settings
  guide: { vi: 'Sổ tay', en: 'Guide' },
  settings: { vi: 'Cài đặt', en: 'Settings' },
  close: { vi: 'Đóng', en: 'Close' },
  language: { vi: 'Ngôn ngữ menu và nút', en: 'Menu and button language' },
  textSize: { vi: 'Cỡ chữ', en: 'Text size' },
  highContrast: { vi: 'Tương phản cao', en: 'High contrast' },
  reduceMotion: { vi: 'Giảm chuyển động', en: 'Reduce motion' },
  on: { vi: 'BẬT', en: 'ON' },
  off: { vi: 'TẮT', en: 'OFF' },
  resetProgress: { vi: 'Xóa tiến trình', en: 'Reset progress' },
  resetConfirm: { vi: 'Xóa hẳn', en: 'Delete' },
  cancel: { vi: 'Hủy', en: 'Cancel' },
  // guide tabs
  tab_terms: { vi: 'Thuật ngữ', en: 'Glossary' },
  tab_formulas: { vi: 'Công thức', en: 'Formulas' },
  tab_science: { vi: 'Science · giả định', en: 'Science · assumptions' },
  tab_dragon: { vi: 'Hồ sơ Rồng', en: 'Dragon files' },
  tab_sources: { vi: 'Nguồn', en: 'Sources' },
  // stepper
  stepBrief: { vi: 'Nhiệm vụ', en: 'Mission' },
  stepBuild: { vi: 'Ráp', en: 'Build' },
  stepOrbit: { vi: 'Quỹ đạo', en: 'Orbit' },
  stepReview: { vi: 'Go/No-Go', en: 'Go/No-Go' },
  stepOps: { vi: 'Vận hành', en: 'Operations' },
  stepDebrief: { vi: 'Báo cáo', en: 'Debrief' },
  // home
  mode: { vi: 'Chế độ', en: 'Mode' },
  difficulty: { vi: 'Độ khó', en: 'Difficulty' },
  solo: { vi: 'Solo', en: 'Solo' },
  coop: { vi: 'Co-op 2–4 người', en: 'Co-op 2–4 players' },
  hoc_vien: { vi: 'Học viên', en: 'Cadet' },
  ky_su: { vi: 'Kỹ sư', en: 'Engineer' },
  giam_doc: { vi: 'Giám đốc', en: 'Director' },
  start: { vi: 'Bắt đầu sứ mệnh', en: 'Start mission' },
  tutorial: { vi: 'Hướng dẫn 3 phút', en: '3-minute tutorial' },
  daily: { vi: 'Nhiệm vụ hôm nay', en: "Today's mission" },
  sandbox: { vi: 'Sandbox', en: 'Sandbox' },
  resume: { vi: 'Tiếp tục sứ mệnh', en: 'Resume mission' },
  science: { vi: 'Science', en: 'Science' },
  home: { vi: 'Trang chủ', en: 'Home' },
  // flow buttons
  back: { vi: 'Quay lại', en: 'Back' },
  continue: { vi: 'Tiếp tục', en: 'Continue' },
  skip: { vi: 'Bỏ qua', en: 'Skip' },
  submit: { vi: 'Nộp bài', en: 'Submit' },
  gotIt: { vi: 'Đã hiểu', en: 'Got it' },
  help: { vi: 'Hướng dẫn', en: 'Help' },
  acceptContract: { vi: 'Nhận hợp đồng', en: 'Accept contract' },
  acceptBuild: { vi: 'Nhận hợp đồng · Ráp vệ tinh', en: 'Accept contract · Build satellite' },
  passScreen: { vi: 'Xem màn chuyền máy', en: 'Show pass-the-device screen' },
  toOrbit: { vi: 'Chọn quỹ đạo', en: 'Choose orbit' },
  toReview: { vi: 'Họp Go/No-Go', en: 'Go/No-Go meeting' },
  launch: { vi: 'PHÓNG', en: 'LAUNCH' },
  replay: { vi: 'Làm lại', en: 'Replay' },
  nextStep: { vi: 'Bước tiếp', en: 'Next step' },
  missionControl: { vi: 'Mission Control', en: 'Mission Control' },
  run: { vi: 'Chạy', en: 'Run' },
  pause: { vi: 'Dừng', en: 'Pause' },
  openEvent: { vi: 'Xem thẻ sự cố', en: 'Open event card' },
  nextEvent: { vi: 'Tua tới sự cố tiếp theo', en: 'Skip to next event' },
  endOps: { vi: 'Kết thúc 72 giờ · Báo cáo', en: 'End 72 h · Debrief' },
  confirm: { vi: 'Xác nhận & tiếp tục', en: 'Confirm & continue' },
  exportSpec: { vi: 'Xuất spec sheet (PNG)', en: 'Export spec sheet (PNG)' },
  rerun: { vi: 'Sửa & chạy lại (giữ thiết kế)', en: 'Fix & rerun (keep design)' },
  postQuiz: { vi: 'Làm quiz sau', en: 'Take the after-quiz' },
  toShare: { vi: 'Tạo mission patch · Chia sẻ', en: 'Make mission patch · Share' },
  toShareQuiz: { vi: 'Quiz sau · Tạo mission patch', en: 'After-quiz · Mission patch' },
  copy: { vi: 'Sao chép kết quả', en: 'Copy result' },
  dlCard: { vi: 'Tải thẻ PNG (9:16)', en: 'Download card PNG (9:16)' },
  dlPatch: { vi: 'Tải mission patch PNG', en: 'Download mission patch PNG' },
  shareSocial: { vi: 'Chia sẻ TikTok · Facebook · Zalo', en: 'Share to TikTok · Facebook · Zalo' },
  playAnother: { vi: 'Chơi nhiệm vụ khác', en: 'Play another mission' },
} as const;

export type TKey = keyof typeof DICT;
export type Lang = 'vi' | 'en';

export function translate(lang: Lang, key: TKey): string {
  return DICT[key][lang];
}

export function useT(): (key: TKey) => string {
  const { settings } = useSettings();
  return (key) => translate(settings.lang, key);
}
