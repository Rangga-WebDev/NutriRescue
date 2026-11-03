# UI/UX DESIGN & INTERACTION PRD

## Nama Produk: NutriRescue Design System
**Fokus Dokumen:** Arsitektur Informasi, Psikologi Visual, Spesifikasi Komponen Antarmuka, dan *Micro-interactions*
**Versi:** 1.0 (terintegrasi dengan Master PRD & System PRD NutriRescue)

---

## 1. Filosofi Desain & Psikologi Pengguna

Target utama **NutriRescue** mencakup ibu rumah tangga, kader Posyandu, dan masyarakat luas yang sering menggunakan aplikasi di dapur dengan satu tangan atau dalam kondisi terburu-buru. Oleh karena itu, desain UI/UX mengikuti 3 prinsip utama:

1. **Zero Cognitive Load (Tanpa Beban Berpikir):** Data sains gizi yang rumit (seperti miligram zat besi atau gram emisi karbon) tidak ditampilkan sebagai tabel angka yang membosankan, melainkan diterjemahkan menjadi **visualisasi progres berwarna** dan **bahasa sehari-hari yang empatik**.
2. **Action-Oriented Urgency (Visualisasi Kesegaran):** Pengguna harus bisa membedakan mana bahan yang segar dan mana bahan yang harus dimasak hari ini dalam waktu $< 2\text{ detik}$ melalui pengodean warna semantik (*semantic color coding*).
3. **Rewarding Sustainability (Apresiasi Dampak):** Setiap kali pengguna berhasil menyelamatkan bahan makanan, antarmuka memberikan umpan balik visual yang memuaskan (*gamified impact counter*) agar terbentuk kebiasaan positif.

---

## 2. Sistem Desain (Design Tokens)

### 2.1. Palet Warna Semantik (Tailwind CSS Mapping)
| Token Peran | Kode Hex | Kelas Tailwind | Penggunaan Spesifik pada UI |
| :--- | :--- | :--- | :--- |
| **Primary Brand (Nutri Emerald)** | `#10B981` | `emerald-500` | Tombol CTA utama, indikator status bahan **"Segar"**, dan *progress bar* skor gizi optimal ($\ge 80$). |
| **Primary Dark (Deep Forest)** | `#065F46` | `emerald-800` | Teks judul utama, *header* kartu dampak lingkungan, dan aksen kontras tinggi. |
| **Urgency / Wilt Warning (Warm Amber)** | `#F59E0B` | `amber-500` | Lencana bahan **"Mulai Layu - Prioritas Masak!"**, ikon tips retensi nutrisi saat memasak. |
| **Danger / Deficit Alert (Rose Red)** | `#EF4444` | `rose-500` | Banner **Peringatan Defisit Protein** dan penanda bahan **"Tidak Layak Konsumsi"**. |
| **Science Info (Sky Blue)** | `#0EA5E9` | `sky-500` | Kartu **Panduan Penyimpanan Ilmiah (Food-Save)** di kulkas/suhu ruang. |
| **Canvas & Surface** | `#F8FAFC` / `#FFFFFF` | `slate-50` / `white` | Latar belakang halaman utama yang bersih dan permukaan kartu dengan *soft shadow* (`shadow-sm`). |

### 2.2. Tipografi & Hierarki Keterbacaan
* **Font Utama:** *Plus Jakarta Sans* atau *Inter* (Sans-serif humanis dengan keterbacaan angka yang jelas).
* **Ukuran Minimum:** Teks isi resep dan penjelasan gizi minimal `15px` (`text-sm` hingga `text-base`) dengan `line-height: 1.6` (`leading-relaxed`) agar nyaman dibaca oleh ibu-ibu atau lansia tanpa perlu memperbesar layar.
* **Kontras Aksesibilitas:** Memenuhi standar **WCAG AA** (rasio kontras minimal $4.5:1$ untuk teks normal).

---

## 3. Spesifikasi Tata Letak & Komponen per Layar (Wireframe Specs)

### 3.1. Komponen 1: Sticky Impact Header (Bar Dampak Kumulatif)
Terletak di bagian paling atas halaman, menampilkan hasil nyata kontribusi pengguna:
* **Layout:** Grid 3 kolom kompak di layar HP, atau baris horizontal di layar desktop.
* **Elemen:**
  1. 🥬 **Pangan Diselamatkan:** Angka tebal dalam satuan $\text{gram}$ atau $\text{kg}$.
  2. 💰 **Belanja Dihemat:** Format mata uang `Rp XX.XXX`.
  3. 🌍 **Jejak Karbon Dicegah:** Angka dalam $\text{g CO}_2\text{e}$ dilengkapi *tooltip* singkat: *"Setara dengan mengurangi asap kendaraan bermotor"*.

### 3.2. Komponen 2: Smart Pantry Scanner & Profile Selector (Zona Input)
* **Selector Profil Gizi (Pill Tabs / Dropdown):**
  * Pilihan jelas dengan ikon: 👶 *MPASI (6-11 Bln)*, 🧒 *Balita 1-3 Thn (Fokus Anti-Stunting)*, 🤰 *Ibu Hamil/Menyusui*, 👨‍👩‍👧 *Keluarga Umum*.
* **Dropzone & Camera Trigger:**
  * Area berbingkai garis putus-putus (`border-dashed border-2 border-emerald-300 bg-emerald-50/40`) dengan tombol besar **"Ambil Foto Isi Dapur / Kulkas"**.
  * Menampilkan pratinjau foto (*image preview*) begitu pengguna memilih gambar, disertai tombol hapus/ganti foto.
* **Quick Judge Demo Bar (Khusus Kemudahan Penjurian Lomba):**
  * Dua tombol cepat di bawah kamera:
    * ✨ **Simulasi 1: Sisa Tahu, Telur & Bayam Layu** (Menunjukkan skenario gizi optimal & penyelamatan sayur layu).
    * ⚠️ **Simulasi 2: Hanya Nasi & Kangkung** (Menunjukkan skenario *Peringatan Defisit Protein* secara *real-time*).

### 3.3. Komponen 3: Interactive Loading State (Edukasi Saat Menunggu)
Saat menunggu respons AI ($3 - 5\text{ detik}$), jangan tampilkan *spinner* kosong. Tampilkan animasi tahapan proses ilmiah:
1. 🔍 *"Memindai tingkat kesegaran jaringan sayur & lauk..."*
2. 🧬 *"Menghitung profil asam amino & zat besi pencegah stunting..."*
3. 🍳 *"Meracik teknik memasak ramah nutrisi..."*

### 3.4. Komponen 4: Hasil Deteksi Bahan & Prioritas Kesegaran
* Menampilkan daftar bahan yang terdeteksi dalam bentuk kartu horizontal atau *badge* interaktif:
  * Jika `freshness_status === "Mulai Layu"`, tampilkan indikator titik berkedip (`animate-ping` warna Amber) dengan label **"Olahan Prioritas Hari Ini"**.
  * Menampilkan estimasi bobot gramasi di sebelah nama bahan (contoh: `Bayam Hijau • ~100g`).

### 3.5. Komponen 5: Dashboard Sains Gizi & Skor Anti-Stunting
* **Visualisasi Skor Utama:** Lingkaran skor atau *badge* besar bertuliskan `Skor Cegah Stunting: 92/100`.
* **Conditional Alert Banner (Peringatan Defisit Protein):**
  * Hanya muncul jika `protein_deficit_warning !== null`. Berwarna latar merah muda lembut (`bg-rose-50 border-l-4 border-rose-500 text-rose-800`) dengan ikon peringatan dan saran penambahan 1 bahan protein murah.
* **Grafik Pemenuhan AKG Mikronutrisi:**
  * Empat *progress bar* horizontal untuk **Zat Besi ($\text{Fe}$)**, **Seng ($\text{Zn}$)**, **Kalsium ($\text{Ca}$)**, dan **Vitamin A**.
  * Dilengkapi kotak **"Penjelasan Sains Gizi"** yang menjelaskan dengan bahasa sederhana mengapa kombinasi bahan tersebut bagus untuk pertumbuhan anak.

### 3.6. Komponen 6: Kartu Resep & Callout Retensi Nutrisi
* **Header Resep:** Judul masakan, estimasi waktu masak (misal: `⏱️ 15 Menit`), dan target usia.
* **Highlight Box (Sains Retensi Nutrisi):** Kotak berlatar kuning hangat (`bg-amber-50 border border-amber-200`) di atas langkah memasak yang menyoroti cara agar vitamin/mineral tidak rusak saat dimasak.
* **Daftar Langkah Memasak:** Nomor urut bulat berwarna hijau (`1`, `2`, `3`) yang bisa dicentang (*checkable steps*) oleh ibu saat sedang memasak di dapur.

### 3.7. Komponen 7: Kartu Food-Save (Panduan Penyimpanan Ilmiah) & Tombol Klaim
* **Kartu Penyimpanan:** Berlatar biru muda (`bg-sky-50`), menjelaskan cara menyimpan sisa bahan yang tidak terpakai (misal: cara merendam tahu dengan air matang di kulkas).
* **Sticky/Bottom Action Button:** Tombol penuh berwarna hijau zamrud **"✅ Selesai Masak & Klaim Dampak Pangan"**. Saat diklik, tombol berubah menjadi **"🎉 Dampak Berhasilambahkan (+360g Pangan Diselamatkan!)"** dan angka di *Header* atas langsung bertambah dengan animasi transisi angka.

---

## 4. Responsivitas & Standar Performa UI (Mobile-First)

1. **Mobile Breakpoint (`< 768px`):** Tata letak 1 kolom penuh (*single-column vertical stack*). Area sentuh tombol (*touch target*) minimal memiliki tinggi `48px` agar mudah ditekan dengan ibu jari.
2. **Desktop Breakpoint (`>= 1024px`):** Tata letak 2 kolom (*split view*)—Kolom Kiri ($40\%$) untuk unggah foto, pilih profil, dan daftar bahan terdeteksi; Kolom Kanan ($60\%$) untuk Dashboard Analisis Sains Gizi, Resep, dan Panduan Penyimpanan.