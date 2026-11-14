# ORBIT 72 — manual end-to-end checklist (CP4)

Run on the deployed site or `npm run build && npm run preview` (http://localhost:4173/orbit72/).
Test once on a laptop (≥ 1280 px) and once on a phone in landscape (≤ 900 px), plus one pass in portrait.
Before starting: Settings → **Xóa tiến trình** (or a private window).

Each step lists what to do, what you should see, and the GDD §12 edge cases it covers.
`tests/e2e.test.tsx` automates the same walk with the reducer and server rendering, so a failing manual step
that the automated walk passes usually means a browser-only problem (click, keyboard, layout, download).

| # | Screen(s) | Do | Expect | GDD §12 |
|---|---|---|---|---|
| 1 | Home · Settings · Guide · Quiz | Open ⚙: switch EN → VI, text 125 % → 150 % → 100 %, high contrast on/off, reduced motion on/off; Esc closes. Press **?** (Sổ tay): try every tab and search “pin”; Esc closes and returns to Home. Pick Solo · Kỹ sư → **Bắt đầu sứ mệnh**. On Quiz(pre) answer 3 questions, then **Bỏ qua**. | Only menus and buttons change language; text grows without horizontal scroll; focus outline always visible; Guide opens on the right tab and Esc returns; quiz has 5 questions and skip goes to Brief. | — |
| 2 | Brief | Look at the map, then **Nhận hợp đồng · Ráp vệ tinh**. | 72 h rain layer labelled “NASA GPM IMERG V07 Final · 7–10/9/2024”, legend in mm, “Hà Nội 197 mm / 72 h”. | — |
| 3 | Build | Remove **Payload SOS** (✕). Try **Chọn quỹ đạo**. Add SOS back. | Button is locked; message names the missing part; R8 shows VƯỢT. | #1 |
| 4 | Build | Add “Pin bổ sung” until the bay is full, then try another part; switch chassis to 3U. | “Không đủ chỗ: … cần N ô”; “Khung 3U chỉ có 6 ô” and the chassis stays. Undo the changes. | #2, #3 |
| 5 | Build | Swap UHF for S-band (tutorial step); open the S-band card. | Data bar goes ĐẠT; card shows the margin computed at the current altitude (8,4 dB at 520 km). | — |
| 6 | Orbit | Pick launcher “Thang Máy ISS” while on SSO; then preset “Thấp 20°”, 420 km, “Tên Lửa Riêng”. Go back to SSO 520 · 4×1 · Xe Buýt SSO. | ISS card says “KHÔNG: Chỉ quỹ đạo ISS 51,6° · 400 km”; lifetime row says “(ngoại suy)” and R4 is VƯỢT at 420 km. | #5, #9, #16 |
| 7 | Orbit → Review | Set 6 planes × 3 satellites, open Go/No-Go. Return to 4 × 1. | R5 VƯỢT; Review lists “Ràng buộc cứng chưa đạt: R5”; **PHÓNG** locked. | #6, #10 |
| 8 | Build | Make the slowest design (12U + S-band + env test). | Dev time stays ≤ 18 months (max 13 with the v1.1 parts). The “> 18 months → P1h = 0” path is covered by `tests/ops.test.ts`. | #8 |
| 9 | Review → Launch | Try the stepper to jump to Vận hành; vote NO-GO for FD without a reason; then 4 × GO and **PHÓNG**; step through Launch. | Vận hành is not clickable; “NO-GO cần ghi lý do (mã R)”; after 4/4 GO launch works; Launch shows the stages and **Mission Control →**. | #12 |
| 10 | Ops | Run ×360; at each event card try Esc (card closes, “Xem thẻ sự cố” reopens it), Tab stays inside the card; choose E0-A, E1-B; **reload the page**; then E2-A; drag the time slider; finish. | Reload returns to Mission Control with E0/E1 choices kept; rain layer + legend follow the slider; DONKI record (10/05/2024, Kp 9) on E1; finish opens Debrief. | #11 |
| 11 | Debrief → Quiz(post) → Share | Export the spec sheet PNG; **Quiz sau · Tạo mission patch**, answer all 5; on Share download card + patch PNG, copy result; back to Debrief → **Sửa & chạy lại**. | THÀNH CÔNG 8/8; badge CML 3 → 4 after export and the PNG header says CML 4; quiz row “x → y / 5 (+g)”; Share: Vận hành square yellow, “CML 4 · JPL”, “4 mặt phẳng → khoảng trống 3,0 h”, SOS tile labelled in plain words; rerun opens Build with the same design/orbit and run 2. | #14 |
| 12 | Co-op · mobile | Home → Co-op; Setup with 2, 3 and 4 players (names optional, flip cards); pass-the-device screens (Esc dismisses). On a phone: portrait shows “Xoay ngang để chơi tốt hơn”; landscape ≤ 900 px stacks panels and wraps the HUD; nothing scrolls sideways at 360 px. | 2 players: FD+QĐ / VT+KH; 3 players: FD / VT+KH / QĐ; 4: one role each; hint dismissible; all buttons ≥ 44 px. | #13 |

## Walk log — 2026-11-14 (Claude Code, no browser available)

- **Automated walk** (`tests/e2e.test.tsx`, steps 1–12): 14/14 pass.
- **Preview build** (`vite preview`): index, JS/CSS bundles, all 8 data files and 4 map files return HTTP 200; the bundle contains the
  new screens (quiz, guide, settings, rotate hint, SOS tile).
- **Not walked (needs a browser):** clicks, keyboard (Tab order, Esc, focus trap), PNG downloads and Web Share, clipboard,
  reload in a real tab, text size/contrast visuals, phone portrait/landscape layout, horizontal scroll at 360 px.
- **Blockers found:** none.
- **Differences from GDD §12 (not blockers, left as is):**
  - #4 camera/X-band: parts removed in v1.1, edge case no longer applies.
  - #5 an incompatible launcher card can still be selected (it shows the reason and Review blocks launch); the GDD says greyed out.
  - #6 over-budget locks **PHÓNG** at Review, not the Build/Orbit “continue” buttons. (Fixed in the final build: event options that cost money are disabled with “Không đủ ngân sách: còn <x>k” — `tests/budget.test.tsx`.)

## Walk log — final build (2026-11-14 14:45)

- Automated walk re-run: `tests/e2e.test.tsx` 14/14, `tests/fullrun.test.tsx` 5/5, `tests/budget.test.tsx` 3/3; full suite 275/275.
- Blockers found: none. Browser-only items above are still unwalked.
  - #7 with no contact minutes R2 fails, but the exact sentence “Không có lượt liên lạc với Hòa Lạc” was not checked.
  - #8 unreachable with the current components (see step 8).

## v1.1 (simplified) — 2026-11-14

- Removed features (Giám đốc, launch failures, E3/E4, camera/imaging, Daily, X-band/AIS/edge OBC/thruster/precise ADCS) are no longer part of any step.
- New checks: every “?” explainer opens and its “Xem trong Sổ tay” link lands on the right Guide card; a corrupted or v1.0 save loads without a crash (tests/audit.test.tsx).
