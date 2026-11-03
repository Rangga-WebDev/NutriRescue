This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Konfigurasi AI NutriRescue

1. Salin `.env.example` menjadi `.env.local`, lalu isi `GEMINI_API_KEY` ([buat kunci di Google AI Studio](https://aistudio.google.com/apikey)).
2. Opsional: ganti model lewat `GEMINI_MODEL` (default `gemini-3.5-flash-lite`) dan `GEMINI_FALLBACK_MODEL` (default `gemini-3.1-flash-lite`). Model cadangan dipakai otomatis bila model utama sibuk, terkena kuota, tidak tersedia, timeout, atau memberi JSON tidak valid.

### `POST /api/analyze`

Body JSON:

```json
{ "imageBase64": "data:image/jpeg;base64,...", "targetProfile": "anak_1_2_thn" }
```

- `targetProfile`: `mpasi_6_12_bln`, `anak_1_2_thn`, atau `anak_2_5_thn`.
- `imageBase64`: data URL atau base64 murni (JPEG, PNG, WebP, HEIC; maks. 4 MB).
- Sukses (200): `NutriRescueResponse` (lihat `types/nutrirescue.ts`).
- Gagal: `{ "error": { "code": "...", "message": "..." } }` dengan kode `INVALID_REQUEST`, `INVALID_IMAGE`, `NOT_FOOD_IMAGE`, `NO_USABLE_INGREDIENTS`, `AI_BLOCKED`, `AI_NOT_CONFIGURED`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_UNAVAILABLE`, atau `AI_INVALID_RESPONSE`.

AI hanya memberi estimasi mentah (bahan, berat, kesegaran, resep, gizi per porsi). Persentase AKG (Permenkes RI No. 28/2019), kalori (faktor Atwater), Skor Cegah Stunting, peringatan defisit protein, serta dampak lingkungan (CO₂e = berat × 2,5) dihitung ulang secara deterministik di `lib/nutrition-science.ts`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
