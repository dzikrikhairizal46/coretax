# 🔄 Logo Update Instructions

## Masalah: Logo Tidak Berubah

Jika logo CoreTax tidak berubah di browser, ini disebabkan oleh **browser caching**. Browser menyimpan gambar logo di cache untuk mempercepat loading, sehingga perubahan tidak langsung terlihat.

## Solusi Cepat

### 1. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Atau**: Klik kanan → Refresh pilih "Empty Cache and Hard Reload"

### 2. Buka Developer Tools
- Tekan `F12` atau `Ctrl+Shift+I`
- Klik kanan pada tombol refresh
- Pilih "Empty Cache and Hard Reload"

### 3. Gunakan Keyboard Shortcut
- Tekan `Ctrl+Shift+L` (script cache busting otomatis)

## Solusi Manual

### Chrome/Edge
1. Buka Settings → Privacy and Security → Clear browsing data
2. Pilih "Cached images and files"
3. Klik "Clear data"

### Firefox
1. Buka Settings → Privacy & Security → Cookies and Site Data
2. Klik "Clear Data"
3. Centang "Cached Web Content"
4. Klik "Clear"

### Safari
1. Buka Settings → Privacy → Manage Website Data
2. Klik "Remove All"

### Mobile Browser
1. Buka browser settings
2. Cari "Clear browsing data" atau "Clear cache"
3. Pilih "Cached images and files"
4. Restart browser

## File yang Diperbarui

### 1. Logo Baru
- `public/coretax-logo.png` - Logo utama (1024x1024)
- `public/icon-192x192.png` - Icon PWA 192x192
- `public/icon-512x512.png` - Icon PWA 512x512

### 2. Konfigurasi
- `src/app/layout.tsx` - Metadata dan icon configuration
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker dengan cache busting

### 3. Cache Busting Tools
- `public/cache-bust.js` - Script untuk force cache reload
- `public/cache-clear.html` - Instruksi clear cache
- `public/.htaccess` - Cache control headers

## Verifikasi

Setelah membersihkan cache:

1. ✅ Logo baru muncul di tab browser
2. ✅ Nama aplikasi: "CoreTax - Sistem Manajemen Pajak"
3. ✅ PWA dapat diinstall dengan logo baru
4. ✅ Icon di home screen (mobile) menggunakan logo baru

## Troubleshooting

Jika logo masih tidak berubah:

1. **Clear semua cache** termasuk cookies
2. **Restart browser** sepenuhnya
3. **Buka tab baru** atau jendela incognito
4. **Check Developer Tools** → Network tab → Disable cache
5. **Tunggu beberapa menit** untuk CDN/server cache update

## Catatan Developer

- Cache busting parameters ditambahkan (`?v=1`)
- Service worker diperbarui untuk cache logo baru
- Automatic cache busting script di-load pada setiap halaman
- Cache headers dikonfigurasi untuk expire dalam 1 jam

---
*Terakhir diperbarui: $(date)*