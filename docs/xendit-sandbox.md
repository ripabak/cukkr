# Xendit Sandbox — Panduan Lengkap

Implementasi langganan (subscription) Cukkr dengan payment gateway **Xendit** — mode **sandbox/test** dulu.

Dokumen ini adalah satu-satunya referensi yang kamu butuhkan untuk: dapat kredensial dari dashboard Xendit, set lingkungan, lalu mencoba alur pembayaran end-to-end (sampai data user berubah & langganan expire).

> Untuk **dokumentasi teknis implementasinya** (arsitektur, file, detail endpoint, webhook, schema DB, keamanan, testing) lihat [`cukkr-backend/docs/billing-xendit.md`](../cukkr-backend/docs/billing-xendit.md).

---

## 1. Arsitektur (gambaran besar)

```
cukkr-frontend (app)                 cukkr-backend                      Xendit
┌──────────────────────┐   POST /api/billing/subscription/checkout   ┌──────────────┐
│ BillingScreen         │ ──────────────────────────────────────────► │ POST /v2/invoices (QRIS)
│ "Bayar sekarang"      │                                            │  → invoice_url
│  → buka invoice_url   │ ◄────────────────────────────────────────── │              │
└──────────────────────┘   { invoiceUrl }                            └──────┬───────┘
                                                                            │
     customer bayar QRIS di halaman Xendit (hosted)                        │ webhook
                                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ POST /api/billing/webhook/xendit  (verifikasi x-callback-token, idempotent)           │
│  invoice.paid   → subscription user: planId=premium/business, status=ACTIVE,         │
│                   periodStart→start, periodEnd = +1 bulan (renewal extends)           │
│  invoice.expired→ payment row ditandai expired (langganan tidak berubah)              │
└─────────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼ cron harian (03:00) "subscription-expiry"
   ACTIVE & periodEnd < sekarang → EXPIRED (expire date berfungsi)
```

**Sumber kebenaran harga & fitur**: `cukkr-backend/src/modules/billing/catalog.ts`
(Free Rp 0 / Premium Rp 99.000 / Business Rp 299.000, `maxBarbershops` untuk enforcement).

**Endpoint baru:**

| Endpoint | Auth | Fungsi |
|---|---|---|
| `GET /api/billing/plans` | publik | katalog (sudah ada sebelumnya) |
| `POST /api/billing/subscription/checkout` | login | buat invoice pending → panggil Xendit QRIS → balikin `invoiceUrl` |
| `GET /api/billing/subscription` | login | plan efektif user + tanggal berakhir |
| `POST /api/billing/webhook/xendit` | token | terima callback `invoice.paid` / `invoice.expired` |

**Tabel DB baru** (migration `drizzle/20260816203022_billing-subscriptions.sql`):
- `subscription` — 1 baris per user (planId, status, currentPeriodStart, currentPeriodEnd/expire)
- `subscription_payment` — audit per percobaan bayar (reference_id, xendit_invoice_id, status)

---

## 2. Cara Mendapatkan Env Variables dari Xendit

### 2.1. Daftar akun (test mode, TANPA KYC penuh)

1. Buka **https://dashboard.xendit.co** → **Sign Up**.
2. Daftar dengan email + **nomor telepon** → verifikasi kode OTP.
3. Pilih opsi **"Test / Development"** (bukan live business) bila ditanya target produksi.
4. Setelah login, dashboard otomatis berada di **Test Mode** — badge "TEST" biasanya terlihat di pojok.

> **Soal "human verification":**
> - **Test mode**: cukup verifikasi email + nomor HP (OTP). Kamu langsung bisa mengambil **test API key** tanpa dokumen apa pun.
> - **Live mode** (baru kalau mau go-live): Xendit mewajibkan **verifikasi identitas & dokumen usaha** (KYC — KTP pemilik, NPWP/usaha legal, alamat operasional), plus **aktivasi channel** oleh tim Xendit. Proses ini butuh beberapa hari dan review manual.
> - Selama pengembangan & demo sandbox, **tidak perlu KYC**.

### 2.2. Buat secret API key (test)

1. Dashboard → **Settings** → **Developers** → **API Keys**.
2. Pilih tab **Test** (bukan Live).
3. **Create / Generate New Key** → beri nama mis. `cukkr-backend-local`.
4. Centang permission **Write** (minimal yang dipakai: invoice).
5. Salin **Secret API Key** — di test mode formatnya diawali `xnd_development_...`.

> ⚠️ Rahasia: jangan pernah commit / kirim key ini ke client (app/website). Hanya boleh ada di server (`cukkr-backend/.env`).

### 2.3. Konfigurasi Webhook & callback token

1. Dashboard → **Settings** → **Webhooks**.
2. Klik **Create Webhook**:
   - **URL**: `https://<tunnel-host>/api/billing/webhook/xendit` (contoh: `https://abc123.ngrok.app/api/billing/webhook/xendit` — lihat §4 cara membuka tunnel).
   - **Events**: pilih **`invoice.paid`** dan **`invoice.expired`**.
3. Xendit akan menampilkan **Callback Token** → salin ke `XENDIT_WEBHOOK_TOKEN`.

### 2.4. Channel QRIS

- Test mode: channel **QRIS** aktif secara default; tidak perlu aktivasi manual.
- (Live nanti: Dashboard → **Payment Channels** → aktifkan QRIS + kirim aktivasi.)

### 2.5. Ringkasan env

```bash
# cukkr-backend/.env  (tambahkan di bawah baris VAPID)
XENDIT_SECRET_API_KEY=xnd_development_xxxxxxxx   # Settings > Developers > API Keys (Test)
XENDIT_WEBHOOK_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx     # Settings > Webhooks > Callback Token
XENDIT_API_URL=https://api.xendit.co             # default sudah benar
```

Setelah diisi, **restart** dev server backend.

---

## 3. Setup & Menjalankan

### Backend

```bash
cd cukkr-backend
# 1. Simpan env (lihat §2.5)
cp .env.example .env   # lalu isi, termasuk XENDIT_* dan DATABASE_URL

# 2. Migrasi DB (tabel subscription & subscription_payment) — sudah dibuat, tinggal apply
bunx drizzle-kit migrate

# 3. Jalankan
bun run dev            # http://localhost:3000

# 4. Test cepat
curl http://localhost:3000/api/billing/plans | head -c 300
```

### Frontend app

```bash
cd cukkr-frontend
bunx type-share-eden-elysia sync http://localhost:3000/types/app.d.ts   # pastikan types sinkron dgn backend yg jalan
bun run web            # atau expo start, jalankan di emulator/device
```

---

## 4. Webhook dari Xendit → Laptop Lokal (tunnel)

Xendit (cloud) tidak bisa menjangkau `localhost`. Untuk sandbox di laptop, buka tunnel HTTPS dengan **ngrok**:

```bash
# terminal 1 (harus tetap berjalan)
ngrok http 3000
# output: Forwarding https://xxxx.ngrok.app -> http://localhost:3000
```

Lalu pasang di **Dashboard Xendit → Settings → Webhooks**:

```
URL webhook  : https://xxxx.ngrok.app/api/billing/webhook/xendit
Events       : invoice.paid, invoice.expired
```

Cara memastikan webhook sampai (tanpa menunggu pembayaran beneran):
Dashboard → Settings → Webhooks → klik webhook → **"Send Test" / kirim sample payload** → cek log backend:

```bash
tail -f logs/example.log   # harus muncul POST /api/billing/webhook/xendit 200
```

> Kalau Xendit tidak dapat mengirim (URL mati / token salah), ia mengulang sampai 6× dengan backoff. Endpoint kita sudah idempotent, jadi aman.

---

## 5. Mencoba Alur Lengkap (end-to-end)

### Prasyarat
- Backend jalan + `XENDIT_*` terisi.
- Webhook URL terpasang (ngrok dll), callback token benar.

### Langkah

1. **Login** di app Cukkr (buat akun baru bila perlu) → menu **Profile → Paket & Langganan** → layar **Billing**.
2. Pilih paket **Premium** (Rp 99.000) atau **Business** (Rp 299.000) → pilih metode **QRIS** → **Bayar sekarang**.
   - App memanggil `POST /api/billing/subscription/checkout` → server membuat invoice di Xendit → app membuka `invoice_url` (halaman checkout Xendit).
3. Di halaman Xendit, di test mode tampil **QRIS pembayaran test**.
4. **Simulasikan pembayaran sukses** (pilih salah satu):
   - **Cara A (paling mudah)** — Dashboard Xendit → halaman **Test / Payment Simulation** → simulasikan pembayaran invoice tsb; atau
   - **Cara B** — Dashboard → **Settings → Webhooks → Send Test** dengan payload `invoice.paid` (id invoice asli dari langkah 2); atau
   - **Cara C (curl)** — kirim sendiri payload `invoice.paid` dengan token benar:
     ```bash
     curl -X POST http://localhost:3000/api/billing/webhook/xendit \
       -H "Content-Type: application/json" \
       -H "x-callback-token: <XENDIT_WEBHOOK_TOKEN>" \
       -d '{"id":"<xendit_invoice_id_dari_checkout>","external_id":"<reference_id>","status":"PAID","amount":99000,"paid_at":"2026-08-16T10:00:00Z","payment_id":"pay_test"}'
     ```
5. Kembali ke app → **GET /api/billing/subscription** sekarang bilang:
   ```json
   { "planId": "premium", "plan": { "name": "Premium", ... }, "status": "active",
     "currentPeriodEnd": "2026-09-16T10:00:00Z" }
   ```
   Banner di BillingScreen menampilkan **Premium — Berakhir: 16 September 2026**. Profile → "Paket & Langganan" jadi **Premium** (bukan Free).

### Apa yang berubah pada data user saat payment sukses?
1. Baris `subscription` user dibuat/diupdate: `planId=premium|business`, `status=ACTIVE`, `currentPeriodEnd=+1 bulan`.
2. Baris `subscription_payment` jadi `status=PAID` + `paid_at` (audit).
3. `GET /subscription` (dan tampilan app) langsung memakai plan efektif.
4. (Production) Enforcement barbershop memakai `maxBarbershops` dari plan — Free=1, Premium=3, Business=unlimited — dicek di `allowUserToCreateOrganization` (`src/lib/auth.ts`).

### Payment yang kamu bayar DIJALANKAN ulang (renewal)
- Langganan masih aktif & belum expire → `currentPeriodEnd` **ditambah 1 bulan** dari tanggal berakhir lama (bukan dari sekarang).
- Sudah expire / tidak ada → periode baru mulai dari `paid_at`.

### Payment gagal/expired
- Kirim webhook `invoice.expired` → hanya `subscription_payment` jadi `EXPIRED`; langganan aktif **tidak** berubah.
- Webhook `PAID` dengan jumlah ≠ harga plan → ditolak (400), payment jadi `failed`.
- Tanpa `XENDIT_*` terisi → checkout 400 *"Xendit is not configured"* → app menampilkan modal *"Pembayaran belum tersedia"*.

### Expire date (cron)
- Cron harian jam 03:00 `subscription-expiry` memindahkan `ACTIVE` yang lewat `currentPeriodEnd` → `EXPIRED`.
- Seketika setelah itu `GET /subscription` kembali `planId=free, status=expired`.
- (Production) user Free otomatis kena limit 1 barbershop.

---

## 6. Verifikasi Keamanan yang Sudah Dipasang

- ✅ Secret key hanya di server (`src/lib/xendit.ts`), Basic Auth `base64(secret:)"`.
- ✅ Webhook diverifikasi `x-callback-token` (constant-time compare) sebelum menyentuh state; tanpa token → 401.
- ✅ Idempotent: webhook duplikat (PAID berulang) tidak memperpanjang periode dua kali.
- ✅ Amount diverifikasi terhadap harga katalog (webhook PAID dengan angka aneh → 400, tidak mengaktivasi).
- ✅ Fulfillment hanya dari webhook (tidak pernah dari redirect/URL sendirian).
- ✅ `reference_id` = idempotency key; `xendit_invoice_id` disimpan untuk dedupe.

---

## 7. Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Checkout 400 "Xendit is not configured" | `XENDIT_SECRET_API_KEY` kosong / server belum di-restart | Isi `.env` lalu restart `bun run dev` |
| Webhook selalu 401 | `XENDIT_WEBHOOK_TOKEN` beda dengan token di Dashboard | Salin ulang token, restart |
| Webhook tidak pernah sampai | ngrok mati / URL salah / event tidak dicentang | Jalankan ulang ngrok, cek URL **persis** `/api/billing/webhook/xendit`, pilih event `invoice.paid` + `invoice.expired` |
| Checkout 400 "Payment method DANA is not enabled" | Hanya QRIS yang dibuka di MVP | Gunakan QRIS (lihat `ENABLED_PAYMENT_METHODS` di `src/modules/billing/service.ts`) |
| Langganan tidak aktif setelah bayar | Webhook belum sukses / paid_at beda jumlah | Kirim ulang webhook test; cek log backend `logs/example.log` |
| Test suite | Xendit tidak boleh dipangil nyata | Test memakai mock (`Object.assign` di `tests/modules/billing-subscription.test.ts`) |

---

## 8. Tes Otomatis

```bash
cd cukkr-backend
bun test --env-file=.env tests/modules/billing-subscription.test.ts   # 10 tes
bun test --env-file=.env                                              # seluruh suite (400 tes)
```

Yang ditest: 401 tanpa login, checkout → invoice URL, penolakan metode non-QRIS, aktivasi via webhook PAID, idempotensi duplikat, 401 token salah, EXPIRED tidak menyentuh langganan, penolakan amount mismatch, dan cron expire.

---

## 9. Roadmap Selanjutnya (setelah sandbox OK)

1. **Auto-renew otomatis** — ganti mode 1-bulan manual dengan **Xendit Subscriptions** (recurring) supaya user tidak perlu bayar manual tiap bulan.
2. **Channel lain** — buka Virtual Account (BCA/BNI/BRI/Mandiri), E-Wallet (OVO/DANA/GoPay), Retail (Alfamart/Indomaret) dengan menambah `ENABLED_PAYMENT_METHODS`.
3. **Webhook reconciliation** — job berkala membandingkan invoice `PENDING` yg melewati `expires_at` dengan status di Xendit.
4. **Refund / downgrade / cancel** — endpoint cancel langganan + penanganan `refund` bila ada.
5. **Go-live** — KYC + aktivasi channel live → ganti key test→live → pindahkan webhook ke URL produksi → nonaktifkan mode permissive org-creation (`allowUserToCreateOrganization` di `src/lib/auth.ts` sudah membaca plan, tinggal diuji di production).