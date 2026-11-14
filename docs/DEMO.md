# ORBIT 72 — Kịch bản demo 60 giây (cho bạn thuyết trình)

Trang chơi: **https://holisurt.github.io/orbit72/** · Giới thiệu: **https://holisurt.github.io/orbit72/about.html**

Từ v1.3 game hoàn toàn bằng tiếng Anh. Tên nút trong bảng dưới đây ghi **đúng như trên màn hình** (tiếng Anh); phần giải thích và lời nói bằng tiếng Việt.

Trước khi lên sân khấu: mở trang chơi, bấm ⚙ **Settings → Reset progress… → Delete** để bắt đầu sạch. Nên cầm máy ngang.

## Đường demo (khoảng 60 giây)

| Giây | Màn | Làm gì | Nói gì |
|---|---|---|---|
| 0–5 | Trang chủ | Chọn **Co-op 2–4 players** và **Engineer** → **Start mission**. | “Siêu bão đổ bộ miền Bắc — đội có 18 tháng để giữ liên lạc trong 72 Giờ Vàng.” |
| 5–10 | Chuẩn bị đội · Quiz | Để 4 người chơi → **Accept contract** → ở Quiz bấm **Skip** → **Accept contract · Build satellite**. Màn chuyền máy: bấm **“I am the … — start my turn”**. | “Bốn vai: Flight Director, Spacecraft Engineer, Mission Scientist, Orbit & Comms Engineer.” |
| 10–22 | Build | Chỉ vào HUD: thanh **Data** đang **OVER** vì UHF quá chậm. Tab **Radio** → bấm **+** ở **S-band 2.2 GHz**, rồi **✕** gỡ UHF ở cột **Installed**. Thanh Data thành **PASS**. → **Choose orbit**. | “Mỗi linh kiện đổi ngay điện, pin, tiền, dữ liệu.” |
| 22–35 | Orbit | Đặt **Orbital planes = 1**: khoảng trống **11.9 h**. Tăng **Satellites per plane** lên **3**: vẫn **~11 h** (cùng mặt phẳng → cùng giờ qua Hà Nội). Về 1 vệ tinh/mặt phẳng, tăng lên **4 mặt phẳng**: **3.0 h** — NEAR (vẫn đạt). Chi phí **2,640k**. → **Go/No-Go meeting**. | “Rải mặt phẳng quỹ đạo mới rút ngắn khoảng trống, thêm vệ tinh cùng chuyến thì không.” |
| 35–40 | Go/No-Go → Launch | Bốn vai bấm **GO** (**4/4 GO — Unanimous**) → **LAUNCH** → **Mission Control →**. | “Ai NO-GO phải ghi lý do bằng mã R.” |
| 40–50 | Mission Control | Bấm **Run**; khi thẻ **E1 · Solar storm** hiện: chỉ vào bản ghi thật NASA DONKI (10 May 2024, Kp 9) và so sánh **46 / 48 / 48 %** → chọn **B · Keep relaying** → **Confirm & continue**. Các thẻ sau chọn phương án **BEST**. Bản đồ có lớp mưa NASA IMERG. | “Mỗi phương án được tính thật trên 72 giờ: bao nhiêu phần trăm tin SOS tới nơi trong 1 giờ.” |
| 50–57 | Debrief | **MISSION SUCCESS — 8/8 requirements passed**. Bấm **Export spec sheet (PNG)** → huy hiệu **CML 4**. | “5 sao, chuỗi ‘vì sao’, và độ chín ý tưởng theo thang của JPL.” |
| 57–60 | Share | **Quiz again · Mission patch** (có thể **Skip**) → thẻ chia sẻ và mission patch ngôi sao trống đồng Đông Sơn (“TEAM BABY DRAGON · 72 GOLDEN HOURS · ORBIT 72”). | “Dữ liệu thật của NASA, vật lý thật, chơi ngay trên điện thoại.” |

## Số liệu cần nhớ (đọc đúng như trên màn hình: dấu chấm thập phân, dấu phẩy hàng nghìn)

- Longest coverage gap (SSO 520 km, 4 mặt phẳng × 1): **3.0 h**
- SOS delivered within 1 h: **49 %** · SOS delivered within 1 h (weighted by NASA IMERG rain): **48.1 %**
- Chi phí lời giải S1: **2,640k USD** (ngân sách Engineer 3,000k)
- Orbital lifetime ở 520 km: **6.5 years**
- Link margin ở 520 km, góc ngẩng 10°: **UHF 9.7 · S 8.4 · SOS 9.3 dB**
- E1 Solar storm A/B/C: **46 / 48 / 48 %** · E2 Hoa Lac station power cut A/B/C: **49 / 45 / 48 %**
- NASA DONKI: bão địa từ **10 May 2024, Kp 9**
- Bão Yagi: **6,285 trạm phát sóng** mất liên lạc

## Xóa tiến trình

⚙ **Settings** (góc trên phải mọi màn) → **Reset progress…** → **Delete**. Cỡ chữ, tương phản, giảm chuyển động vẫn giữ nguyên.

## Nếu mất Wi-Fi

1. Dùng bản offline: giải nén **orbit72-v1.3-hanoi-offline.zip** (tải ở trang Release của GitHub, nên tải sẵn vào máy từ trước).
2. Mở terminal trong thư mục vừa giải nén, chạy: `npx serve .` (hoặc `python -m http.server 8000`).
3. Mở địa chỉ hiện ra (thường là http://localhost:3000). Không bấm đúp index.html — trình duyệt sẽ chặn dữ liệu.
4. Font sẽ là font hệ thống khi không có mạng; game chạy giống hệt.

## Nếu có sự cố trên sân khấu

- Bấm nhầm màn: dùng thanh bước (**1 Contract · 2 Build · 3 Orbit**) để quay lại trước khi phóng.
- Thẻ sự cố bị đóng: bấm **Open event card** ở cột phải. Phím **Esc** đóng thẻ, Handbook và Settings.
- Chữ nhỏ trên máy chiếu: ⚙ **Settings** → **Text size 125%**.
- Bị hỏi một thuật ngữ: bấm **?** cạnh thuật ngữ (một câu giải thích) hoặc **See the Handbook →**.
