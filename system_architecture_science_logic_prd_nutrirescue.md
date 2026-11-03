# SYSTEM ARCHITECTURE & SCIENCE LOGIC PRD

## Nama Sistem: NutriRescue Core Engine
**Fokus Dokumen:** Arsitektur Teknis, Pipeline AI Multimodal, Skema Data, dan Algoritma Sains Gizi/Lingkungan
**Versi:** 1.0 (terintegrasi dengan Master PRD NutriRescue)

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

Sistem **NutriRescue** dirancang menggunakan arsitektur *Serverless Edge-Ready Web Application* agar ringan diakses oleh masyarakat menggunakan *smartphone* kelas menengah ke bawah, namun memiliki kemampuan komputasi sains dan *Computer Vision* tingkat lanjut di sisi *cloud*.

* **Client Layer (PWA Frontend):** Next.js 14+ (App Router), React 18, TypeScript. Bertugas menangani kompresi citra di sisi klien (*client-side image compression*) sebelum dikirim ke server, manajemen *state* sesi pengguna, serta penyimpanan riwayat dampak di `localStorage`.
* **API & Business Logic Layer:** Next.js Route Handlers (`/api/analyze-pantry`). Bertindak sebagai orkestrator yang menyuntikkan *System Instruction* berbasis tabel Angka Kecukupan Gizi (AKG) Kemenkes RI, memvalidasi input, dan menerapkan perhitungan sains lingkungan.
* **AI & Vision Layer:** Google Gemini API (`gemini-2.5-flash` via SDK `@google/genai`). Memproses citra bahan makanan secara *multimodal* dan mengembalikan objek JSON terstruktur (*Structured Outputs*) dengan *deterministic schema*.
* **Fallback & Reliability Layer:** *Mock Scientific Engine* otomatis yang akan aktif dalam $< 100\text{ ms}$ apabila koneksi internet di lokasi penjurian tidak stabil atau kuota API habis.

---

## 2. Alur Pemrosesan Data (Data Pipeline)

1. **Image Acquisition & Pre-processing (Client):**
   * Pengguna memotret bahan makanan melalui kamera HP atau memilih file gambar.
   * Sistem mengubah ukuran gambar (*downscaling*) ke resolusi maksimal $1024 \times 1024\text{ piksel}$ (format WebP/JPEG kualitas $0.8$) dan mengonversinya menjadi string `base64` agar ukuran *payload* $< 500\text{ KB}$.
2. **Context Injection (Client $\rightarrow$ Server):**
   * Client mengirimkan `POST /api/analyze-pantry` berisi: `imageBase64`, `targetProfile` (misal: `balita_1_3_tahun`), dan `manualIngredients` (opsional).
3. **Multimodal Inference & Science Calculation (Server $\rightarrow$ Gemini API):**
   * Server memanggil `ai.models.generateContent` menggunakan `responseSchema` ketat.
   * Model melakukan 3 tugas paralel:
     1. **Object Detection & Freshness Grading:** Mengenali jenis sayur/lauk, mengestimasi bobot gramasi, dan menilai tingkat kelayuan dari warna/tekstur visual.
     2. **Nutritional Matching:** Mencocokkan kandungan gizi per $100\text{ g}$ bahan (mengacu pada Tabel Komposisi Pangan Indonesia / TKPI) dengan target AKG profil pengguna.
     3. **Culinary & Preservation Synthesis:** Menyusun langkah resep yang meminimalkan kerusakan mikronutrisi akibat panas serta cara penyimpanan sisa bahan.
4. **Post-processing & Persistence (Server $\rightarrow$ Client):**
   * Server memverifikasi konsistensi perhitungan karbon ($W_{\text{gram}} \times 2.5$) dan mengirimkan JSON ke Client.
   * Saat pengguna menekan tombol klaim, metrik disimpan secara atomik ke `localStorage` pada kunci `nutrirescue_impact_v1`.

---

## 3. Spesifikasi API & Skema Kontrak Data

### 3.1. Endpoint Utama: `POST /api/analyze-pantry`

**Request Payload:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "targetProfile": "balita_1_3_tahun",
  "demoScenarioId": null,
  "additionalNotes": "Tidak ada alergi, hanya punya kompor gas biasa"
}
```

**Strict Response Schema (`NutriRescueAnalysisResponse`):**
| Field | Tipe Data | Deskripsi & Aturan Validasi |
| :--- | :--- | :--- |
| `detected_ingredients` | `Array<Object>` | Daftar bahan terdeteksi: `name` (string), `estimated_weight_g` (number), `freshness_status` (`Segar` \| `Mulai Layu` \| `Tidak Layak`), `urgency_score` ($1-10$). |
| `recommended_recipe` | `Object` | Berisi `title`, `target_audience`, `cooking_time_minutes`, `nutrient_retention_tip` (wajib berbasis sains kimia pangan), dan `steps` (`string[]`). |
| `nutrition_science` | `Object` | Berisi `stunting_prevention_score` ($0-100$), `calories_kcal`, `macronutrients` (`protein_g`, `carbs_g`, `fat_g`), `micronutrients_akg_pct` (`iron_fe`, `zinc`, `calcium`, `vitamin_a`), `scientific_explanation`, dan `protein_deficit_warning` (`string` \| `null`). |
| `food_rescue_impact` | `Object` | Berisi `saved_weight_grams`, `estimated_money_saved_idr`, `co2_prevented_grams`, dan `storage_tips` (`Array<{ingredient, method, shelf_life_increase_days}>`). |

---

## 4. Algoritma & Rumus Sains Inti (Core Scientific Logic)

### 4.1. Matriks Acuan AKG Kemenkes RI (Permenkes No. 28 Tahun 2019)
Sistem menggunakan konstanta referensi berikut untuk menghitung persentase pemenuhan gizi harian:

| Profil Pengguna | Energi ($\text{kkal}$) | Protein ($\text{g}$) | Zat Besi / $\text{Fe}$ ($\text{mg}$) | Seng / $\text{Zn}$ ($\text{mg}$) | Kalsium / $\text{Ca}$ ($\text{mg}$) | Vitamin A ($\text{mcg}$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Balita 6–11 Bulan (MPASI)** | $800$ | $15$ | $11$ | $3$ | $270$ | $400$ |
| **Balita 1–3 Tahun (Anti-Stunting)** | $1350$ | $20$ | $7$ | $3$ | $650$ | $400$ |
| **Ibu Hamil (Trimester 2/3)** | $2550$ | $70$ | $27$ | $12$ | $1200$ | $900$ |
| **Keluarga Umum (Dewasa Rata-rata)** | $2150$ | $60$ | $13$ | $10$ | $1000$ | $600$ |

### 4.2. Logika Deteksi Defisit Protein & Peringatan Stunting
Dalam sains tumbuh kembang anak, defisiensi asam amino esensial (protein hewani) berkorelasi langsung dengan rendahnya hormon pertumbuhan *Insulin-like Growth Factor-1* ($\text{IGF-1}$).
* **Aturan Sistem:**
  $$\text{Jika } \left(\frac{\text{Protein Resep (g)}}{\text{Target Protein Harian Profil (g)}}\right) \times 100\% < 25\%$$
* **Tindakan Sistem:** Set nilai `protein_deficit_warning` menjadi string aktif: *"Peringatan Gizi: Kombinasi bahan saat ini belum mencukupi kebutuhan protein minimum untuk mencegah stunting. Sangat disarankan menambahkan minimal 1 butir telur ayam (+6g protein) atau 50g tempe/ikan."*

### 4.3. Kalkulasi Dampak Lingkungan & Ekonomi Mikro
1. **Berat Diselamatkan ($W_{\text{saved}}$):** Jumlah total `estimated_weight_g` dari seluruh bahan yang berstatus `Segar` dan `Mulai Layu` yang masuk ke dalam resep:
   $$W_{\text{saved}} = \sum_{i=1}^{n} w_i \quad (\text{untuk status } \neq \text{Tidak Layak})$$
2. **Emisi Gas Rumah Kaca Dicegah ($E_{\text{CO}_2}$):**
   $$E_{\text{CO}_2} (\text{gram}) = W_{\text{saved}} (\text{gram}) \times 2.5$$
3. **Estimasi Penghematan Uang ($M_{\text{saved}}$):**
   Menggunakan rata-rata indeks harga bahan pangan pokok rumah tangga Indonesia ($\approx \text{Rp } 35 - \text{Rp } 50 \text{ per gram}$ bahan campuran sayur dan protein):
   $$M_{\text{saved}} (\text{IDR}) = \sum_{i=1}^{n} (w_i \times P_{\text{kategori}, i})$$

---

## 5. Kebutuhan Non-Fungsional & Keamanan Pangan (Safety Guardrails)

1. **Food Safety Guardrail (Prioritas Tertinggi):** Apabila *Computer Vision* mendeteksi tanda pembusukan lanjut (jamur hitam/hijau pada roti/tahu, lendir berlebih, atau perubahan warna ekstrem), sistem **dilarang** memasukkannya ke dalam resep dan wajib menampilkan banner peringatan bahaya keracunan pangan (*Foodborne Illness Alert*).
2. **Waktu Respons (Latency):** Pemrosesan API menggunakan model `gemini-2.5-flash` ditargetkan selesai dalam $3 - 6\text{ detik}$.
3. **Offline/Demo Resilience:** Menyediakan 2 *preset payload* berbasis sains di dalam kode sehingga saat presentasi di hadapan juri, aplikasi dijamin $100\%$ berjalan mulus tanpa bergantung pada sinyal Wi-Fi ruangan lomba.