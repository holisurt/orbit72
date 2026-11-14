# ORBIT 72 — Kịch bản demo 60 giây (cho bạn thuyết trình)

Trang chơi: **https://holisurt.github.io/orbit72/** · Giới thiệu (tiếng Anh): **https://holisurt.github.io/orbit72/about.html**

Trước khi lên sân khấu: mở trang chơi, bấm ⚙ **Cài đặt → Xóa tiến trình → Xóa hẳn** để bắt đầu sạch. Nên cầm máy ngang.

## Đường demo (khoảng 60 giây)

| Giây | Màn | Làm gì | Nói gì |
|---|---|---|---|
| 0–5 | Trang chủ | Chọn **Co-op 2–4 người** và **Kỹ sư** → **Bắt đầu sứ mệnh**. | “Siêu bão đổ bộ miền Bắc — đội có 18 tháng để giữ liên lạc 72 giờ.” |
| 5–10 | Chuẩn bị đội · Quiz | Để 4 người chơi → **Nhận hợp đồng** → ở Quiz bấm **Bỏ qua** → **Nhận hợp đồng · Ráp vệ tinh**. Màn chuyền máy: bấm “Tôi là … bắt đầu lượt”. | “Bốn vai: Flight Director, Vệ tinh, Khoa học, Quỹ đạo.” |
| 10–22 | Ráp vệ tinh | Chỉ vào HUD: thanh **Dữ liệu VƯỢT** vì UHF quá chậm. Tab **Liên lạc** → **+ S-band**, rồi **✕** gỡ UHF. Thanh Dữ liệu thành ĐẠT. → **Chọn quỹ đạo**. | “Mỗi linh kiện đổi ngay điện, pin, tiền, dữ liệu.” |
| 22–35 | Quỹ đạo | Đặt **1 mặt phẳng**: khoảng trống **11,9 h**. Tăng vệ tinh mỗi mặt phẳng lên **3**: vẫn **~11 h** (cùng mặt phẳng → cùng giờ qua Hà Nội). Về 1 vệ tinh/mặt phẳng, tăng lên **4 mặt phẳng**: **3,0 h** — ĐẠT. Chi phí **2.640k**. → **Họp Go/No-Go**. | “Rải mặt phẳng mới rút ngắn khoảng trống, thêm vệ tinh cùng chuyến thì không.” |
| 35–40 | Go/No-Go → Phóng | Bốn vai bấm **GO** (4/4 GO) → **PHÓNG** → **Mission Control →**. | “Ai NO-GO phải ghi lý do bằng mã R.” |
| 40–50 | Mission Control | Bấm **Chạy**; khi thẻ **E1 bão từ** hiện: chỉ vào bản ghi thật NASA DONKI (10/5/2024, Kp 9) và so sánh **46 / 48 / 48 %** → chọn **B**. Các thẻ sau chọn phương án “TỐT NHẤT”. Bản đồ có lớp mưa NASA IMERG. | “Mỗi phương án có P1h tính thật trên 72 giờ.” |
| 50–57 | Báo cáo | **THÀNH CÔNG — 8/8**. Bấm **Xuất spec sheet (PNG)** → huy hiệu **CML 4**. | “5 sao, chuỗi ‘vì sao’, và độ chín ý tưởng theo thang của JPL.” |
| 57–60 | Chia sẻ | **Quiz sau · Tạo mission patch** (có thể Bỏ qua) → thẻ chia sẻ và mission patch ngôi sao trống đồng. | “Dữ liệu thật của NASA, vật lý thật, chơi ngay trên điện thoại.” |

## Số liệu cần nhớ

- Khoảng trống dài nhất (SSO 520 km, 4 mặt phẳng × 1): **3,0 h**
- P1h: **49,1 %** · P1h_mưa (trọng số mưa NASA IMERG): **48,1 %**
- Chi phí lời giải S1: **2.640k USD** (ngân sách Kỹ sư 3.000k)
- Tuổi thọ quỹ đạo ở 520 km: **L = 6,5 năm**
- Biên đường truyền ở 520 km, góc ngẩng 10°: **UHF 9,7 · S 8,4 · SOS 9,3 dB**
- Sự cố E1 (bão từ) A/B/C: **46 / 48 / 48 %** · E2 (mất điện trạm) A/B/C: **49 / 45 / 48 %**
- NASA DONKI: bão địa từ **10/5/2024, Kp 9**
- Bão Yagi: **6.285 trạm phát sóng** mất liên lạc

## Xóa tiến trình

⚙ **Cài đặt** (góc trên phải mọi màn) → **Xóa tiến trình…** → **Xóa hẳn**. Cỡ chữ, ngôn ngữ, tương phản vẫn giữ nguyên.

## Nếu mất Wi-Fi

1. Dùng bản offline: giải nén **orbit72-v1.0-hanoi-offline.zip** (tải ở trang Release của GitHub, nên tải sẵn vào máy từ trước).
2. Mở terminal trong thư mục vừa giải nén, chạy: `npx serve .` (hoặc `python -m http.server 8000`).
3. Mở địa chỉ hiện ra (thường là http://localhost:3000). Không bấm đúp index.html — trình duyệt sẽ chặn dữ liệu.
4. Font sẽ là font hệ thống khi không có mạng; game chạy giống hệt.

## Nếu có sự cố trên sân khấu

- Bấm nhầm màn: dùng thanh bước (Nhiệm vụ · Ráp · Quỹ đạo) để quay lại trước khi phóng.
- Thẻ sự cố bị đóng: bấm **Xem thẻ sự cố** ở cột phải. Phím **Esc** đóng thẻ, sổ tay, cài đặt.
- Chữ nhỏ trên máy chiếu: ⚙ → Cỡ chữ **125 %**.
