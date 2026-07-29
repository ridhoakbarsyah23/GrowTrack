# GrowTrack

GrowTrack adalah sistem pengembangan karir untuk dua jalur utama:

- Karyawan yang ingin naik jabatan atau pindah level karir.
- Fresh graduate yang ingin siap masuk dunia kerja.

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
```

Lalu buka:

```text
http://localhost:3000
```

Halaman utama adalah login. Setelah login berhasil, frontend masuk ke:

```text
http://localhost:3000/dashboard
```

User baru bisa register di:

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

Register membutuhkan career goal yang sudah dibuat admin. User dengan role `employee` atau `fresh_graduate` akan melihat profile career miliknya sendiri di dashboard.

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

Seeder default hanya membuat akun admin awal:

```text
email: admin@growtrack.id
password: 123456789
```

Data operasional seperti user karyawan, fresh graduate, career goal, skill, assessment, dan roadmap tidak lagi dibuat dari dummy seeder. Masukkan data asli melalui halaman `/admin`.

Urutan input data yang disarankan:

1. Buat career goal.
2. Buat skill.
3. Hubungkan career goal dan skill lewat target score.
4. Buat assessment template.
5. Buat assessment questions.
6. Buat roadmap modules.
7. Buat user employee/fresh graduate dan pilih career goal.

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
