# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Nama Produk: NutriRescue

**Judul Lomba:** NutriRescue: Pengubah Sisa Bahan Dapur Menjadi Menu Bergizi Seimbang Berbasis *Computer Vision* dan Sains Gizi (Studi Kasus: Pencegahan *Stunting* & Pengurangan Sampah Pangan Rumah Tangga)

**Versi Dokumen:** 1.0

**Status:** Siap Eksekusi Prototipe / MVP Lomba

## 1. Ringkasan Eksekutif (Executive Summary)

**NutriRescue** adalah aplikasi web progresif (PWA) berbasis *Multimodal AI* (*Computer Vision* & *Generative AI*) yang dikombinasikan dengan prinsip Sains Gizi dan Sains Lingkungan. Aplikasi ini memungkinkan masyarakat (khususnya ibu rumah tangga) memotret sisa bahan makanan yang ada di dapur atau kulkas, lalu secara otomatis mendeteksi tingkat kesegarannya, meracik resep masakan ramah anak pencegah *stunting*, menghitung estimasi pemenuhan Angka Kecukupan Gizi (AKG) standar Kementerian Kesehatan RI, serta memberikan panduan ilmiah penyimpanan bahan makanan (*shelf-life extension*) untuk menekan angka sampah pangan rumah tangga (*food waste*).

## 2. Latar Belakang & Rumusan Masalah

1. **Krisis Sampah Pangan Rumah Tangga (*Food Waste*):** Indonesia merupakan salah satu penghasil sampah pangan terbesar di dunia (23–48 juta ton per tahun), dan kontributor terbesarnya berasal dari tingkat rumah tangga. Banyak sayur, tahu, tempe, atau lauk segar terbuang karena mulai layu dan pemilik rumah bingung mengolahnya menjadi menu baru.

2. **Tantangan Nasional Pencegahan *Stunting*:** Banyak keluarga mengira makanan bergizi tinggi untuk mencegah *stunting* harus mahal. Padahal, bahan sederhana di dapur (seperti telur, tahu, tempe, hati ayam, dan sayuran lokal) jika dikombinasikan dan dimasak dengan teknik yang benar memiliki kandungan asam amino esensial dan zat besi yang sangat baik untuk pertumbuhan linier anak.

3. **Kesenjangan Pengetahuan Sains Pangan:** Masyarakat awam jarang mengetahui teknik memasak yang mempertahankan nutrisi (*nutrient retention*) serta cara menyimpan sisa bahan makanan agar tidak cepat membusuk akibat oksidasi atau pertumbuhan mikroba.

## 3. Tujuan Produk & Metrik Keberhasilan (Success Metrics)

* **Tujuan Sains Gizi:** Membantu pengguna menyusun menu harian yang memenuhi minimal **30%–40% AKG harian** per porsi makan untuk makronutrisi (Protein) dan mikronutrisi krusial pencegah *stunting* (Zat Besi/$\text{Fe}$, Seng/$\text{Zn}$, Kalsium/$\text{Ca}$, dan Vitamin A).

* **Tujuan Lingkungan & Ekonomi:** Mengurangi pembuangan bahan makanan layak konsumsi di rumah tangga dan menghitung dampak nyata berupa:

  * Berat pangan yang diselamatkan ($\text{gram}$ / $\text{kg}$).

  * Estimasi penghematan uang belanja rumah tangga ($\text{Rp}$).

  * Pengurangan emisi gas rumah kaca ($\text{CO}_2\text{e}$).

* **Target Demo Lomba:** Waktu pemrosesan dari unggah foto hingga keluar resep & analisis gizi $< 8\text{ detik}$, dengan antarmuka yang intuitif dan dapat diuji langsung oleh dewan juri.

## 4. Target Pengguna (User Personas)

| Persona | Karakteristik & Kebutuhan | Solusi NutriRescue | 
| ----- | ----- | ----- | 
| **Ibu Rumah Tangga / Ibu Balita** | Memiliki anak usia 6 bulan – 5 tahun, ingin menyajikan MPASI atau makanan keluarga bergizi dengan anggaran belanja terbatas. | Mendapatkan resep anti-*stunting* dari bahan seadanya di dapur beserta peringatan jika menu kekurangan protein hewani. | 
| **Kader Posyandu / Penyuluh Gizi** | Membutuhkan alat peraga digital untuk mengedukasi warga tentang pemanfaatan bahan pangan lokal. | Menampilkan kalkulasi AKG visual dan penjelasan ilmiah yang mudah dipahami warga. | 
| **Anak Kos / Pekerja Muda** | Sering menyimpan bahan makanan di kulkas sampai layu/busuk karena sibuk dan bingung memasak. | Mendapatkan resep praktis maksimal 15–20 menit dan tips menyimpan sisa bahan agar awet berminggu-minggu. | 

## 5. Spesifikasi Fitur (Functional Requirements)

### 5.1. Smart Pantry Scanner (*Computer Vision*) `[Prioritas: P0 - Wajib]`

* Pengguna dapat mengambil foto langsung melalui kamera *smartphone* atau mengunggah foto bahan makanan di meja dapur/kulkas.

* AI mendeteksi daftar bahan makanan yang terlihat, mengestimasi jumlah/beratnya, dan mengklasifikasikan status kesegarannya ke dalam 3 kategori:

  * **Segar (*Fresh*):** Kondisi optimal.

  * **Mulai Layu (*Wilt/Near-Expiry*):** Masih aman dikonsumsi, namun harus diprioritaskan untuk segera dimasak hari ini.

  * **Tidak Layak (*Spoiled*):** Berjamur atau busuk (diberikan peringatan keamanan pangan untuk dibuang).

* Tersedia fitur **Tambah/Hapus Manual** (*chips input*) dan **Mode Demo Cepat** (skenario bahan siap pakai untuk pengujian instan oleh juri).

### 5.2. Filter Profil Kebutuhan Gizi `[Prioritas: P0 - Wajib]`

* Pengguna dapat memilih target pemakai resep sebelum pemindaian diproses:

  1. *Balita 6–11 Bulan (MPASI Tekstur Lumat/Tim)*

  2. *Balita 1–3 Tahun (Fokus Kejar Tumbuh & Anti-Stunting)*

  3. *Ibu Hamil & Menyusui (Tinggi Folat & Zat Besi)*

  4. *Keluarga Umum (Hemat & Seimbang)*

### 5.3. Generator Resep Ramah Gizi (*Nutrient-Preserving Recipe*) `[Prioritas: P0 - Wajib]`

* Menyusun langkah memasak praktis yang memprioritaskan bahan berstatus **Mulai Layu**.

* Menyertakan **Tips Retensi Nutrisi Ilmiah** (contoh: *"Jangan memasak bayam lebih dari 2 menit agar asam folat dan vitamin C tidak rusak oleh panas berlebih"* atau *"Tambahkan perasan jeruk nipis untuk meningkatkan penyerapan zat besi nabati hingga 3 kali lipat"*).

### 5.4. Kalkulator Sains Gizi & Detektor Defisit Protein `[Prioritas: P0 - Wajib]`

* Menampilkan **Skor Pencegahan Stunting (**$0 - 100$**)** berdasarkan kelengkapan asam amino (protein) dan mikronutrisi.

* Menampilkan rincian energi ($\text{kkal}$), makronutrisi (Protein, Karbohidrat, Lemak dalam $\text{gram}$), serta persentase pemenuhan AKG harian untuk Zat Besi ($\text{Fe}$), Seng ($\text{Zn}$), Kalsium ($\text{Ca}$), dan Vitamin A.

* **Sistem Peringatan Defisit Protein:** Jika bahan yang dipindai hanya berupa sayur atau karbohidrat tanpa sumber protein (misal: hanya kangkung dan nasi), sistem memunculkan kotak peringatan dan menyarankan penambahan bahan protein murah (seperti 1 butir telur atau sepotong tempe).

### 5.5. Panduan Penyimpanan Ilmiah (*Food-Save Storage Guide*) `[Prioritas: P1 - Penting]`

* Memberikan instruksi berbasis sains biologi/kimia pangan untuk memperpanjang masa simpan sisa bahan yang tidak ikut dimasak.

### 5.6. Dashboard Dampak Lingkungan & Ekonomi (*Impact Tracker*) `[Prioritas: P1 - Penting]`

* Mencatat dan mengakumulasikan metrik setiap kali pengguna menekan tombol **"Selesai Masak & Klaim Dampak"**:

  * Total berat bahan makanan yang diselamatkan ($\text{gram}$).

  * Estimasi uang belanja yang dihemat ($\text{Rp}$).

  * Total emisi karbon yang dicegah ($\text{gram CO}_2\text{e}$).

## 6. Logika Bisnis & Rumus Sains (Scientific & Business Logic)

Bagian ini merupakan fondasi ilmiah yang membedakan **NutriRescue** dari aplikasi resep biasa di mata juri:

### 6.1. Standar Acuan AKG (Permenkes RI No. 28 Tahun 2019)

Untuk profil utama **Balita 1–3 Tahun**, acuan kebutuhan gizi harian adalah:

* Energi: $1350\text{ kkal/hari}$

* Protein: $20\text{ g/hari}$

* Zat Besi ($\text{Fe}$): $7\text{ mg/hari}$

* Seng ($\text{Zn}$): $3\text{ mg/hari}$

* Kalsium ($\text{Ca}$): $650\text{ mg/hari}$

Persentase kontribusi satu porsi menu terhadap AKG dihitung dengan rumus:

$$
\text{Persentase AKG (\%)} = \left( \frac{\text{Kandungan Gizi dalam Resep}}{\text{Standar AKG Harian Sesuai Profil}} \right) \times 100\%
$$

### 6.2. Rumus Skor Pencegahan Stunting ($S_{\text{stunting}}$)

Skor dihitung pada rentang $0 - 100$ dengan pembobotan khusus pada kecukupan protein dan mikronutrisi pembentuk jaringan tulang/otak:

$$
S_{\text{stunting}} = 0.50(P_{\text{score}}) + 0.30(M_{\text{score}}) + 0.20(B_{\text{score}})
$$


Di mana:

* $P_{\text{score}}$: Skor kecukupan protein (maksimal $100$ jika satu porsi memenuhi $\ge 35\%$ AKG protein harian, terutama jika mengandung protein hewani).

* $M_{\text{score}}$: Rata-rata persentase pemenuhan Zat Besi ($\text{Fe}$), Seng ($\text{Zn}$), dan Kalsium ($\text{Ca}$) terhadap target satu kali makan.

* $B_{\text{score}}$: Keseimbangan kalori dari karbohidrat dan lemak sehat sebagai pelarut vitamin A, D, E, K.

### 6.3. Rumus Konversi Sampah Pangan ke Emisi Karbon ($\text{CO}_2\text{e}$)

Berdasarkan faktor konversi rata-rata dari FAO dan IPCC untuk sampah pangan organik rumah tangga yang membusuk di Tempat Pemrosesan Akhir (TPA) dan menghasilkan gas metana ($\text{CH}_4$):

$$
1\text{ gram sampah pangan} \approx 2.5\text{ gram CO}_2\text{e}
$$


Sehingga rumus dampak lingkungan pada aplikasi adalah:

$$
E_{\text{dicegah}} (\text{g CO}_2\text{e}) = W_{\text{diselamatkan}} (\text{g}) \times 2.5
$$

## 7. Desain UI/UX & Alur Pengguna (User Flow)

### 7.1. Sistem Desain (Design System)

* **Palet Warna:**

  * *Primary (Fresh Emerald):* `#10B981` — Melambangkan keberlanjutan, gizi, dan kesegaran.

  * *Secondary/Warning (Warm Amber):* `#F59E0B` — Menandai bahan yang mulai layu dan harus segera diolah.

  * *Danger/Alert (Rose Red):* `#EF4444` — Peringatan defisit protein atau bahan tidak layak konsumsi.

  * *Neutral Background:* `#F8FAFC` (Slate 50) dengan kartu putih bersih `#FFFFFF`.

* **Tipografi:** Sans-serif modern yang sangat mudah dibaca di layar *smartphone* (Inter / Plus Jakarta Sans).

### 7.2. Alur Penggunaan (User Journey)

1. **Langkah 1 (Pilih Target & Unggah):** Pengguna membuka aplikasi $\rightarrow$ Melihat ringkasan dampak di bagian atas $\rightarrow$ Memilih profil *"Balita 1-3 Tahun (Anti-Stunting)"* $\rightarrow$ Memotret bahan di meja dapur (atau menekan tombol *Demo Skenario*).

2. **Langkah 2 (Deteksi & Prioritas):** Aplikasi menampilkan daftar bahan yang terdeteksi lengkap dengan label warna (*Segar* vs *Mulai Layu - Prioritas Masak!*).

3. **Langkah 3 (Eksplorasi Hasil Sains & Resep):** Pengguna membaca resep langkah demi langkah, melihat grafik batang pemenuhan AKG, membaca tips memasak agar vitamin tidak rusak, dan membaca cara menyimpan sisa bahan.

4. **Langkah 4 (Klaim Dampak):** Pengguna menekan tombol **"Selesai Masak & Klaim Dampak"** $\rightarrow$ Angka pada *Impact Dashboard* bertambah secara *real-time* disertai animasi konfeti/notifikasi apresiasi.

## 8. Arsitektur Teknis & Skema Data JSON

### 8.1. Tech Stack Rekomendasi

* **Frontend & Framework:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Lucide Icons.

* **AI & Computer Vision Engine:** Google Gemini API (`@google/genai` menggunakan model `gemini-2.5-flash`) dengan fitur *Multimodal Input* dan *Structured Outputs* (`responseSchema`).

* **Penyimpanan Data (MVP):** `localStorage` pada peramban untuk menyimpan metrik kumulatif dan riwayat resep tanpa memerlukan konfigurasi *database server* yang rumit saat penjurian.

### 8.2. Kontrak Data JSON (`responseSchema` API)

```
{
  "detected_ingredients": [
    {
      "name": "Bayam Hijau",
      "estimated_qty": "1 ikat (100g)",
      "freshness_status": "Mulai Layu",
      "urgency_level": "High"
    },
    {
      "name": "Telur Ayam",
      "estimated_qty": "2 butir (110g)",
      "freshness_status": "Segar",
      "urgency_level": "Medium"
    },
    {
      "name": "Tahu Putih",
      "estimated_qty": "3 potong (150g)",
      "freshness_status": "Segar",
      "urgency_level": "Medium"
    }
  ],
  "recommended_recipe": {
    "title": "Sup Krim Tahu Telur Bayam Lembut",
    "target_audience": "Balita 1-3 Tahun (Fokus Anti-Stunting)",
    "cooking_time_minutes": 15,
    "nutrient_retention_tip": "Masukkan daun bayam pada 2 menit terakhir sebelum api dimatikan dan tambahkan sedikit minyak/lemak agar penyerapan Vitamin A dan Folat optimal serta tidak rusak oleh panas berlebih.",
    "steps": [
      "Haluskan 2 potong tahu putih, lalu tumis sebentar dengan bawang putih cincang dan sedikit minyak untuk menambah kalori padat.",
      "Tuangkan 300 ml air hangat, tunggu hingga mendidih, lalu tuang kocokan telur secara perlahan sambil diaduk membentuk serabut lembut.",
      "Masukkan daun bayam yang sudah dicuci bersih, masak cukup 2 menit hingga layu, koreksi rasa, dan sajikan hangat."
    ]
  },
  "nutrition_science": {
    "stunting_prevention_score": 92,
    "calories_kcal": 310,
    "macronutrients": {
      "protein_g": 19.5,
      "carbs_g": 9.0,
      "fat_g": 21.0
    },
    "micronutrients_akg_percentage": {
      "iron_fe": 45,
      "zinc": 38,
      "calcium": 35,
      "vitamin_a": 65
    },
    "scientific_explanation": "Telur ayam menyumbangkan protein hewani dengan profil asam amino esensial lengkap yang merangsang hormon pertumbuhan (IGF-1), sedangkan tahu dan bayam memperkaya kalsium serta zat besi untuk mencegah anemia defisiensi besi pemicu stunting.",
    "protein_deficit_warning": null
  },
  "food_rescue_impact": {
    "saved_weight_grams": 360,
    "estimated_money_saved_idr": 14000,
    "co2_prevented_grams": 900,
    "storage_tips": [
      {
        "ingredient": "Sisa 1 Potong Tahu Putih",
        "method": "Cuci bersih dengan air matang, simpan di wadah kedap udara berisi air matang hingga tahu terendam penuh, lalu simpan di chiller kulkas. Ganti air setiap 2 hari agar bebas bakteri asam."
      }
    ]
  }
}

```

## 9. Vibecoding Master Prompt (Siap Pakai untuk Pembuatan Kode)

Salin blok di bawah ini ke asisten koding AI untuk menghasilkan kode aplikasi secara utuh:

```
Act as a Senior Full-Stack Engineer, UI/UX Designer, and Nutritional Data Scientist. Build a complete, production-ready web application called "NutriRescue" (Pengubah Sisa Bahan Dapur Menjadi Menu Bergizi Seimbang Berbasis Computer Vision dan Sains Gizi).

TECH STACK:
- Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React
- Google Gemini API (`@google/genai` with `gemini-2.5-flash`) using Structured JSON Output
- State & Persistence: React Hooks + `localStorage` for cumulative impact metrics

KEY FEATURES TO BUILD:
1. Impact Tracker Header: Shows Total Pangan Diselamatkan (g), Uang Dihemat (Rp), and Emisi Karbon Dicegah (g CO2e = weight * 2.5).
2. Smart Pantry Input: Image upload with camera support, live image preview, Target Profile selector ("Balita 6-11 Bulan (MPASI)", "Balita 1-3 Tahun (Anti-Stunting)", "Ibu Hamil & Menyusui", "Keluarga Umum"), plus 2 "Quick Demo Scenario" buttons ("Demo 1: Bayam Layu, Telur & Tahu" and "Demo 2: Nasi Sisa & Kangkung - Simulasi Defisit Protein") so competition judges can test immediately without uploading a photo.
3. API Route (`/api/analyze-pantry/route.ts`): Accepts base64 image or demo scenario ID + target profile. Calls Gemini 2.5 Flash with strict JSON schema matching the NutriRescue data contract, and includes a rich scientific fallback mock response if `GEMINI_API_KEY` is not set.
4. Results Dashboard:
   - Detected Ingredients with Freshness Badges (Green for Segar, pulsing Amber for Mulai Layu - Prioritas Masak!).
   - Anti-Stunting Nutrition Card with circular/bar score (0-100), Macronutrient breakdown, Micronutrient AKG progress bars (Zat Besi, Seng, Kalsium, Vit A), scientific explanation box, and a red alert banner if `protein_deficit_warning` is triggered.
   - Recipe Card with step-by-step guide and a highlighted "Sains Retensi Nutrisi" callout box.
   - Food-Save Storage Guide Card with scientific shelf-life extension tips.
   - "Selesai Masak & Klaim Dampak" button that updates the `localStorage` impact counters and disables itself after claiming.

Ensure the UI uses a clean, modern Emerald Green (#10B981) and Warm Amber (#F59E0B) palette, responsive mobile-first design, and natural Bahasa Indonesia throughout.

```