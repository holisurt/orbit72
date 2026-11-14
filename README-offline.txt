ORBIT 72 — Bắt Sóng Cứu Hộ · offline build (v1.2 Hanoi, new UI)

Use this when there is no Wi-Fi. Everything (game, NASA data, maps) is inside this folder.

1. Unzip orbit72-v1.2-hanoi-offline.zip.
2. Open a terminal in the unzipped folder, then run:

     npx serve .

   — or open the folder with any static web server
   (for example: python -m http.server 8000, then go to http://localhost:8000).
3. Open the address it prints (usually http://localhost:3000) in Chrome, Edge or Firefox.

Do not double-click index.html: browsers block loading the data files from file://.
Fonts fall back to system fonts without internet; the game works the same.
Live version: https://holisurt.github.io/orbit72/
