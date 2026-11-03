# DATA ARCHITECTURE & BUSINESS LOGIC SPECIFICATION

## Nama Produk: NutriRescue
**Fokus Dokumen:** Pemodelan Data (TypeScript/JSON Schema), Alur State Management, Matriks Keputusan Bisnis, dan Rumus Komputasi Sains Deterministik
**Versi:** 1.0

---

## 1. Arsitektur Data (Data Architecture)

Untuk menjamin kecepatan eksekusi saat penjurian lomba (*zero-latency local persistence*) sekaligus kesiapan skala produksi (*cloud-ready*), arsitektur data **NutriRescue** dibagi menjadi 3 lapisan utama:

1. **In-Memory Session State (React State):** Menyimpan citra yang sedang dipindai (`base64`), profil target AKG yang dipilih, status tahapan *loading*, dan hasil analisis resep aktif.
2. **Strict AI Data Contract (Gemini Structured JSON Schema):** Kontrak data deterministik antara *Backend Route Handler* dan model `gemini-2.5-flash` agar output AI tidak pernah gagal di-*parse* oleh komponen UI.
3. **Client-Side Persistent Store (`localStorage` / IndexedDB):** Menyimpan akumulasi metrik dampak lingkungan/ekonomi (`ImpactMetrics`) dan riwayat penyelamatan pangan (`RescueHistoryItem[]`) tanpa memaksa pengguna membuat akun terlebih dahulu.

---

### 1.1. Model Data Inti (TypeScript Interfaces)

Berikut adalah definisi tipe data lengkap yang menjadi tulang punggung aplikasi (`types/nutrirescue.ts`):

```typescript
// 1. Enum & Tipe Dasar
export type TargetProfileId = 
  | 'mpasi_6_11_bln' 
  | 'balita_1_3_thn' 
  | 'ibu_hamil_menyusui' 
  | 'keluarga_umum';

export type FreshnessStatus = 'Segar' | 'Mulai Layu' | 'Tidak Layak';
export type UrgencyLevel = 'High' | 'Medium' | 'Low' | 'Discard';
export type IngredientCategory = 'protein_hewani' | 'protein_nabati' | 'sayuran' | 'karbohidrat' | 'lemak_bumbu';

// 2. Entitas Bahan Makanan Terdeteksi
export interface DetectedIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  estimated_weight_g: number;
  freshness_status: FreshnessStatus;
  urgency_level: UrgencyLevel;
  visual_cue: string; // Contoh: "Ujung daun sedikit menguning namun batang masih tegak"
  estimated_price_idr: number;
}

// 3. Entitas Sains Gizi & Pencegah Stunting
export interface NutritionScience {
  stunting_prevention_score: number; // Rentang 0 - 100
  score_classification: 'Optimal' | 'Cukup' | 'Defisit Perlu Tambahan';
  calories_kcal: number;
  macronutrients: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    animal_protein_ratio_pct: number; // Persentase protein hewani terhadap total protein
  };
  micronutrients_akg_pct: {
    iron_fe: number;      // % terhadap target AKG harian
    zinc: number;         // % terhadap target AKG harian
    calcium: number;      // % terhadap target AKG harian
    vitamin_a: number;    // % terhadap target AKG harian
  };
  scientific_explanation: string;
  protein_deficit_warning: string | null; // Terisi otomatis jika protein < batas minimum
  recommended_booster_item: string | null; // Contoh: "Tambahkan 1 butir Telur Ayam (+6g Protein Hewani)"
}

// 4. Entitas Resep Ramah Gizi
export interface RecommendedRecipe {
  title: string;
  target_audience_label: string;
  cooking_time_minutes: number;
  texture_category: 'Lumat/Puree' | 'Cincang Halus/Tim' | 'Menu Keluarga Empuk';
  nutrient_retention_tip: string; // Prinsip kimia/fisika pangan saat memasak
  bioavailability_booster_tip: string; // Contoh: "Kombinasi Vitamin C membantu serap Zat Besi"
  steps: string[];
}

// 5. Entitas Dampak Lingkungan & Ekonomi per Sesi
export interface FoodRescueImpact {
  saved_weight_grams: number;
  discarded_weight_grams: number;
  estimated_money_saved_idr: number;
  co2_prevented_grams: number;
  methane_ch4_equivalent_grams: number;
  storage_tips: Array<{
    ingredient_name: string;
    scientific_method: string;
    temperature_zone: 'Chiller (2-4°C)' | 'Freezer (-18°C)' | 'Suhu Ruang Sejuk';
    shelf_life_extension_days: number;
  }>;
}

// 6. Kontrak Respons Utuh API (/api/analyze-pantry)
export interface NutriRescueAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  target_profile: TargetProfileId;
  food_safety_alert: string | null; // Muncul jika ada bahan berstatus 'Tidak Layak'
  detected_ingredients: DetectedIngredient[];
  recommended_recipe: RecommendedRecipe;
  nutrition_science: NutritionScience;
  food_rescue_impact: FoodRescueImpact;
}

// 7. Skema Penyimpanan Lokal Kumulatif (localStorage: 'nutrirescue_store_v1')
export interface PersistentUserStore {
  cumulative_impact: {
    total_saved_weight_grams: number;
    total_money_saved_idr: number;
    total_co2_prevented_grams: number;
    total_recipes_cooked: number;
  };
  rescue_history: Array<{
    analysis_id: string;
    date_iso: string;
    recipe_title: string;
    stunting_score: number;
    saved_weight_grams: number;
    money_saved_idr: number;
  }>;
}
```

---

### 1.2. Tabel Referensi Master: Standar AKG & Indeks Harga (Hardcoded Constants)

Agar perhitungan bisnis tidak mengarang angka (*hallucination-free*), backend menyimpan tabel konstanta referensi berdasarkan **Permenkes RI No. 28 Tahun 2019** dan rata-rata harga pangan nasional:

```typescript
export const AKG_STANDARDS: Record<TargetProfileId, {
  label: string;
  energy_kcal: number;
  protein_g: number;
  iron_mg: number;
  zinc_mg: number;
  calcium_mg: number;
  vit_a_mcg: number;
  meal_portion_target_ ratio: number; // 1 kali makan utama = 30% - 35% kebutuhan harian
}> = {
  mpasi_6_11_bln: {
    label: 'Balita 6-11 Bulan (MPASI)',
    energy_kcal: 800,
    protein_g: 15,
    iron_mg: 11,
    zinc_mg: 3,
    calcium_mg: 270,
    vit_a_mcg: 400,
    meal_portion_target_ratio: 0.30
  },
  balita_1_3_thn: {
    label: 'Balita 1-3 Tahun (Fokus Anti-Stunting)',
    energy_kcal: 1350,
    protein_g: 20,
    iron_mg: 7,
    zinc_mg: 3,
    calcium_mg: 650,
    vit_a_mcg: 400,
    meal_portion_target_ratio: 0.35
  },
  ibu_hamil_menyusui: {
    label: 'Ibu Hamil & Menyusui',
    energy_kcal: 2550,
    protein_g: 70,
    iron_mg: 27,
    zinc_mg: 12,
    calcium_mg: 1200,
    vit_a_mcg: 900,
    meal_portion_target_ratio: 0.35
  },
  keluarga_umum: {
    label: 'Keluarga Umum (Dewasa)',
    energy_kcal: 2150,
    protein_g: 60,
    iron_mg: 13,
    zinc_mg: 10,
    calcium_mg: 1000,
    vit_a_mcg: 600,
    meal_portion_target_ratio: 0.35
  }
};
```

---

## 2. Spesifikasi Logika Bisnis (Business Logic Rules)

Logika bisnis **NutriRescue** dijalankan dalam 4 gerbang aturan (*Rule Gates*) berurutan setiap kali data citra diproses:

### 2.1. Rule Gate 1: Triase Kesegaran & Keamanan Pangan (*Food Safety & Triage Logic*)

Setiap bahan yang terdeteksi oleh *Computer Vision* dievaluasi menggunakan matriks keputusan berikut sebelum boleh masuk ke generator resep:

| Kondisi Visual Bahan | Status Kesegaran | Level Urgensi | Aturan Tindakan Sistem (*Business Action*) |
| :--- | :--- | :--- | :--- |
| Warna cerah, tekstur padat/tegar, tidak ada bercak | `Segar` | `Medium` | Masuk daftar bahan resep normal. Jika berlebih, masukkan sisanya ke modul *Food-Save Storage Guide*. |
| Daun agak terkulai, kulit sedikit keriput, perubahan warna minor karena oksidasi wajar | `Mulai Layu` | `High` | **Prioritas Utama Resep:** Wajib digunakan $100\%$ pada resep hari ini. Berikan label UI berkedip (*Prioritas Masak!*). |
| Terdapat hifa jamur (putih/hitam/hijau), berlendir, perubahan warna ekstrem/busuk | `Tidak Layak` | `Discard` | **Blokir dari Resep:** Bahan dikecualikan dari resep dan perhitungan berat pangan diselamatkan. Aktifkan banner merah `food_safety_alert`. |

---

### 2.2. Rule Gate 2: Kalkulasi Sains Gizi & Deteksi Defisit Protein (*Anti-Stunting Engine*)

Setelah daftar bahan layak olah terkumpul, sistem menghitung nilai gizi satu porsi resep terhadap standar profil AKG yang dipilih:

#### A. Rumus Persentase Pemenuhan AKG per Porsi Makan
Target satu kali makan utama adalah memenuhi $30\% - 35\%$ dari total AKG harian. Namun untuk ditampilkan secara transparan kepada pengguna, persentase AKG dihitung terhadap kebutuhan harian penuh:

$$\text{AKG}_{\text{nutrisi}} (\%) = \min\left(100, \text{round}\left( \frac{\text{Kandungan Nutrisi dalam Resep}}{\text{Standar Harian AKG Profil}} \times 100 \right)\right)$$

#### B. Algoritma Deteksi Defisit Protein & Pemicu Rekomendasi Booster
Asam amino esensial (terutama *leucine*, *lysine*, dan *tryptophan* pada protein hewani) adalah regulator utama jalur sinyal $\text{mTORC1}$ dan hormon pertumbuhan $\text{IGF-1}$ untuk mencegah *stunting*.

* **Kondisi 1 (Kritis - Tanpa Protein Hewani & Total Protein Rendah):**
  Jika $\text{AKG}_{\text{protein}} < 25\%$ **ATAU** tidak ada satu pun bahan berkategori `protein_hewani`:
  * Set `protein_deficit_warning` = *"Menu ini masih rendah asam amino esensial untuk pertumbuhan tinggi badan anak."*
  * Set `recommended_booster_item` = *"Tambahkan 1 butir Telur Ayam atau 50g Hati Ayam/Ikan."*
  * Batasi nilai maksimum `stunting_prevention_score` pada angka $65$ (meskipun vitamin sayurnya tinggi).

* **Kondisi 2 (Cukup - Hanya Protein Nabati Tinggi):**
  Jika hanya terdapat `protein_nabati` (tahu/tempe/kacang) dengan $\text{AKG}_{\text{protein}} \ge 30\%$:
  * Set `protein_deficit_warning` = *"Protein nabati sudah baik, namun penambahan sedikit protein hewani akan menyempurnakan profil asam amino anak."*
  * Batasi nilai maksimum `stunting_prevention_score` pada angka $82$.

* **Kondisi 3 (Optimal - Kombinasi Protein Hewani + Nabati + Mikronutrisi):**
  Jika terdapat `protein_hewani` dengan $\text{AKG}_{\text{protein}} \ge 30\%$ dan rata-rata $\text{AKG}_{\text{Fe, Zn, Ca}} \ge 30\%$:
  * Set `protein_deficit_warning` = `null`.
  * Hitung `stunting_prevention_score` pada rentang $85 - 100$.

#### C. Rumus Deterministik Skor Pencegahan Stunting ($S_{\text{stunting}}$)
$$S_{\text{stunting}} = \text{round}\left( (0.45 \times S_{\text{protein}}) + (0.20 \times S_{\text{animal\_ratio}}) + (0.25 \times S_{\text{micro}}) + (0.10 \times S_{\text{energy}}) \right)$$

Di mana:
* $S_{\text{protein}} = \min\left(100, \frac{\text{AKG}_{\text{protein}}}{35} \times 100\right)$ (Skor penuh $100$ tercapai jika 1 porsi makan memenuhi $35\%$ AKG protein harian).
* $S_{\text{animal\_ratio}} = 100$ jika mengandung protein hewani, atau $40$ jika murni nabati, atau $0$ jika hanya sayur/karbohidrat.
* $S_{\text{micro}} = \min\left(100, \frac{\text{AKG}_{\text{Fe}} + \text{AKG}_{\text{Zn}} + \text{AKG}_{\text{Ca}}}{3 \times 30} \times 100\right)$.
* $S_{\text{energy}} = \min\left(100, \frac{\text{Kalori Resep}}{0.30 \times \text{Target Energi Harian}} \times 100\right)$.

---

### 2.3. Rule Gate 3: Aturan Tekstur & Retensi Nutrisi Memasak (*Culinary Science Rules*)

1. **Penyesuaian Tekstur Otomatis Berdasarkan Usia:**
   * Jika `target_profile === 'mpasi_6_11_bln'` $\rightarrow$ Wajib menghasilkan instruksi penyaringan/penghalusan (`Lumat/Puree`), membatasi penggunaan gula/garam berlebih, dan menambahkan lemak tambahan (*unsalted butter*, santan, atau minyak kelapa/kanola) sebagai pelarut vitamin A, D, E, K.
   * Jika `target_profile === 'balita_1_3_thn'` $\rightarrow$ Menghasilkan tekstur lunak mudah dikunyah (`Menu Keluarga Empuk` / *finger food*).
2. **Aturan Sinergi Bioavailabilitas Gizi (*Nutrient Synergy*):**
   * Zat besi non-heme pada sayuran hijau (bayam/kangkung/kelor) dan tahu/tempe sulit diserap usus anak tanpa bantuan reduktor asam askorbat (Vitamin C).
   * **Logika Sistem:** Setiap kali resep menggunakan sayuran hijau atau kacang-kacangan, sistem wajib menyisipkan `bioavailability_booster_tip` (contoh: menambahkan tomat segar atau sedikit perasan jeruk di akhir masakan).

---

### 2.4. Rule Gate 4: Perhitungan Dampak Ekonomi & Lingkungan (*Sustainability Verification*)

Untuk memastikan angka yang tampil di *Impact Tracker Dashboard* akurat dan dapat dipertanggungjawabkan secara ilmiah di depan juri, backend menjalankan validasi matematika pasca-inferensi AI (*Post-AI Deterministic Override*):

1. **Total Berat Bahan Diselamatkan ($W_{\text{saved}}$):**
   ```typescript
   const validIngredients = detected_ingredients.filter(
     item => item.freshness_status !== 'Tidak Layak'
   );
   const saved_weight_grams = validIngredients.reduce(
     (sum, item) => sum + item.estimated_weight_g, 0
   );
   ```

2. **Perhitungan Penghematan Uang Belanja ($M_{\text{saved}}$):**
   Menggunakan harga estimasi per item atau indeks harga rata-rata per kategori bahan:
   * `protein_hewani`: $\text{Rp } 65 / \text{gram}$ (setara $\text{Rp } 65.000/\text{kg}$)
   * `protein_nabati`: $\text{Rp } 25 / \text{gram}$ (setara $\text{Rp } 25.000/\text{kg}$)
   * `sayuran`: $\text{Rp } 30 / \text{gram}$ (setara $\text{Rp } 30.000/\text{kg}$)
   * `karbohidrat`: $\text{Rp } 18 / \text{gram}$ (setara $\text{Rp } 18.000/\text{kg}$)

3. **Perhitungan Emisi Karbon ($\text{CO}_2\text{e}$) & Metana ($\text{CH}_4$):**
   Berdasarkan koefisien siklus hidup sampah organik rumah tangga (FAO):
   $$\text{CO}_2\text{e Prevented (g)} = \text{round}(W_{\text{saved}} \times 2.5)$$
   $$\text{CH}_4\text{ Prevented (g)} = \text{round}(W_{\text{saved}} \times 0.089)$$

---

## 3. Alur Eksekusi State pada Frontend (State Machine Flow)

```
[IDLE STATE]
  │ Pengguna memilih Target Profile (default: 'balita_1_3_thn')
  │ Pengguna mengunggah Foto ATAU klik Tombol Simulasi Juri
  ▼
[VALIDATING & COMPRESSING IMAGE]
  │ Resolusi dikecilkan maks 1024px, ukuran < 500KB
  ▼
[ANALYZING STATE (Loading Stepper UI)]
  │ Step 1 (0-1.5s): Memindai kesegaran jaringan bahan pangan...
  │ Step 2 (1.5-3.0s): Menghitung kecukupan asam amino & AKG Kemenkes...
  │ Step 3 (3.0s+): Menyusun resep ramah nutrisi & panduan simpan...
  ▼
[RESULT READY STATE]
  ├── Tampilkan Banner Merah JIKA `food_safety_alert !== null`
  ├── Tampilkan Peringatan Defisit Protein JIKA `protein_deficit_warning !== null`
  ├── Render Grafik AKG, Langkah Resep, dan Food-Save Storage Card
  └── Aktifkan Tombol "Selesai Masak & Klaim Dampak" (`isClaimed = false`)
        │
        │ Pengguna menekan tombol klaim
        ▼
[IMPACT CLAIMED STATE (`isClaimed = true`)]
  │ Update `localStorage` secara atomik:
  │   total_saved_weight_grams += current.saved_weight_grams
  │   total_money_saved_idr += current.estimated_money_saved_idr
  │   total_co2_prevented_grams += current.co2_prevented_grams
  └── Trigger animasi konfeti & counter header bertambah real-time
```