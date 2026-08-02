# Pathly AI

Pathly AI adalah AI Career Companion untuk membantu pengguna menyusun arah karier,
mengukur kompetensi, menemukan skill gap, dan mengikuti roadmap pengembangan yang
dipersonalisasi.

- Mahasiswa yang ingin mempersiapkan dunia kerja dan menentukan jalur karier.
- Fresh graduate yang ingin siap masuk dunia kerja.
- Karyawan yang ingin naik jabatan atau pindah level karir.

Stack awal:

- Frontend: Next.js, TypeScript, Tailwind CSS.
- Backend: Laravel API.
- Database target: MySQL.

## Struktur

```text
GrowTrack/
  frontend/  Next.js dashboard
  backend/   Laravel API, migrations, seeders
```

## Menjalankan Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Endpoint awal:

```text
GET http://127.0.0.1:8000/api/career-dashboard
GET http://127.0.0.1:8000/api/public-summary
GET http://127.0.0.1:8000/api/assessment/current
POST http://127.0.0.1:8000/api/assessment/submit
PATCH http://127.0.0.1:8000/api/roadmap-progress/{progress}
POST http://127.0.0.1:8000/api/project-submissions
GET http://127.0.0.1:8000/api/project-submissions/review-queue
PATCH http://127.0.0.1:8000/api/project-submissions/{submission}/review
GET http://127.0.0.1:8000/api/mentor-feedback
POST http://127.0.0.1:8000/api/mentor-feedback
PATCH http://127.0.0.1:8000/api/mentor-feedback/{feedback}
DELETE http://127.0.0.1:8000/api/mentor-feedback/{feedback}
```

Endpoint auth:

```text
POST http://127.0.0.1:8000/api/login
GET  http://127.0.0.1:8000/api/register-options
POST http://127.0.0.1:8000/api/register
POST http://127.0.0.1:8000/api/forgot-password
POST http://127.0.0.1:8000/api/reset-password
GET  http://127.0.0.1:8000/api/me
POST http://127.0.0.1:8000/api/logout
```

Endpoint admin untuk input data asli:

```text
GET  http://127.0.0.1:8000/api/admin/bootstrap
POST http://127.0.0.1:8000/api/admin/users
POST http://127.0.0.1:8000/api/admin/career-goals
PATCH http://127.0.0.1:8000/api/admin/career-goals/{careerGoal}
DELETE http://127.0.0.1:8000/api/admin/career-goals/{careerGoal}
POST http://127.0.0.1:8000/api/admin/skills
PATCH http://127.0.0.1:8000/api/admin/skills/{skill}
DELETE http://127.0.0.1:8000/api/admin/skills/{skill}
POST http://127.0.0.1:8000/api/admin/assessment-templates
PATCH http://127.0.0.1:8000/api/admin/assessment-templates/{assessmentTemplate}
DELETE http://127.0.0.1:8000/api/admin/assessment-templates/{assessmentTemplate}
POST http://127.0.0.1:8000/api/admin/roadmap-modules
PATCH http://127.0.0.1:8000/api/admin/roadmap-modules/{roadmapModule}
DELETE http://127.0.0.1:8000/api/admin/roadmap-modules/{roadmapModule}
POST http://127.0.0.1:8000/api/admin/skill-targets
PATCH http://127.0.0.1:8000/api/admin/skill-targets/{skillTarget}
DELETE http://127.0.0.1:8000/api/admin/skill-targets/{skillTarget}
POST http://127.0.0.1:8000/api/admin/assessment-questions
PATCH http://127.0.0.1:8000/api/admin/assessment-questions/{assessmentQuestion}
DELETE http://127.0.0.1:8000/api/admin/assessment-questions/{assessmentQuestion}
POST http://127.0.0.1:8000/api/admin/products
PATCH http://127.0.0.1:8000/api/admin/products/{product}
DELETE http://127.0.0.1:8000/api/admin/products/{product}
```

`/api/career-dashboard` membutuhkan header:

```text
Authorization: Bearer <token-login>
```

Template `.env.example` sudah diarahkan ke MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=growtrack
DB_USERNAME=root
DB_PASSWORD=
```

Pathly AI Career Coach berjalan dalam mode rule-based secara default. Untuk mengaktifkan enhancement OpenAI, isi `.env` backend:

```env
AI_COACH_ENABLED=true
OPENAI_API_KEY=isi_api_key_di_local_env
OPENAI_MODEL=gpt-5
```

Jangan commit nilai `OPENAI_API_KEY`. Jika konfigurasi Laravel pernah di-cache, jalankan `php artisan config:clear` setelah mengubah `.env`.

Seeder production tidak membuat data operasional dummy. Jika butuh akun admin awal, isi `.env` backend secara lokal sebelum menjalankan `php artisan migrate --seed`:

```env
SEED_ADMIN_NAME=Pathly AI Admin
SEED_ADMIN_EMAIL=email_admin_asli
SEED_ADMIN_PASSWORD=password_kuat_di_local_env
```

Jangan commit nilai `SEED_ADMIN_EMAIL` atau `SEED_ADMIN_PASSWORD`. Setelah admin pertama tersedia, masukkan data asli dari halaman Admin.

Sebelum migrate dengan MySQL, buat database-nya:

```sql
CREATE DATABASE growtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Menjalankan Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend default membaca API dari:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_MANUAL_PAYMENT_INSTRUCTIONS=
```

Lalu buka:

```text
http://localhost:3000
```

Halaman utama adalah login. Setelah login berhasil, frontend masuk ke:

```text
http://localhost:3000/dashboard
```

User baru bisa register dan membuat career profile awal di:

```text
http://localhost:3000/register
```

User mengerjakan assessment di:

```text
http://localhost:3000/assessment
```

Reset password tersedia di:

```text
http://localhost:3000/forgot-password
http://localhost:3000/reset-password
```

Untuk mode development, endpoint forgot password mengembalikan reset token langsung di response. Nanti saat email service sudah disiapkan, token ini bisa dikirim lewat email.

Register membutuhkan career goal yang sudah dibuat admin. User dengan role `student`, `fresh_graduate`, atau `employee` akan melihat profile career miliknya sendiri di dashboard.

Data onboarding awal mengikuti PRD:

- Pendidikan.
- Pengalaman.
- Skill.
- Minat.
- Target karier.

Admin masuk ke halaman input data:

```text
http://localhost:3000/admin
http://localhost:3000/admin/evidence
http://localhost:3000/admin/mentor-feedback
http://localhost:3000/admin/products
http://localhost:3000/evidence-review
http://localhost:3000/mentor-feedback
```

## Akun Awal

Seeder hanya membuat akun admin awal jika `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` diisi di `.env` lokal. Jika dua variable itu kosong, `php artisan migrate --seed` tidak membuat user, produk, course, webinar, career goal, skill, assessment, atau roadmap.

Data operasional seperti user mahasiswa, fresh graduate, karyawan, career goal, skill, assessment, roadmap, course, dan webinar harus dimasukkan dari data asli melalui halaman `/admin`.

Urutan input data yang disarankan:

1. Buat career goal.
2. Buat skill.
3. Hubungkan career goal dan skill lewat target score.
4. Buat assessment template.
5. Buat assessment questions.
6. Buat roadmap modules.
7. Buat user mahasiswa/fresh graduate/karyawan dan pilih career goal.

## Fitur Yang Sudah Disiapkan

- Career tracks untuk karyawan dan fresh graduate.
- Skill catalog.
- Assessment templates.
- Roadmap modules.
- Target score skill per career goal.
- Assessment questions per assessment template dan skill.
- Readiness score formula.
- Dashboard Next.js yang mengambil data dari Laravel API tanpa fallback dummy.
- Halaman admin sederhana untuk input data asli.

## Verifikasi

```bash
cd backend
php artisan test
```

```bash
cd frontend
npm run lint
npm run build
```
