"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PublicNav } from "./components/PublicNav";

type Audience = "employee" | "fresh_graduate";

type PublicData = {
  career_goals: number;
  skills: number;
  assessment_templates: number;
  roadmap_modules: number;
  active_profiles: number;
  career_goal_cards: CareerGoalCard[];
  skill_categories: SkillCategory[];
  roadmap_preview: RoadmapPreview[];
  assessment_preview: AssessmentPreview[];
  mentor_feedback: MentorFeedback[];
  updated_at: string;
};

type CareerGoalCard = {
  id: number;
  audience: Audience;
  title: string;
  level: string;
  summary: string;
  module_count: number;
  total_hours: number;
  skill_count: number;
};

type SkillCategory = {
  category: string;
  skill_count: number;
};

type RoadmapPreview = {
  id: number;
  career_goal: string;
  audience: Audience;
  sequence: number;
  title: string;
  module_type: string;
  duration_hours: number;
  outcome: string;
};

type AssessmentPreview = {
  id: number;
  audience: Audience;
  title: string;
  description: string;
  question_count: number;
};

type MentorFeedback = {
  id: number;
  mentor_name: string;
  learner_name: string;
  career_goal: string;
  recommendation: string;
  score: number;
  notes: string;
};

type CourseProduct = {
  title: string;
  slug: string;
  category: string;
  price: number;
  level: string;
  lessons: number;
  duration: string;
  outcome: string;
  accent: string;
};

type WebinarProduct = {
  title: string;
  slug: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  speaker: string;
  topic: string;
};

const audienceLabel: Record<Audience, string> = {
  employee: "Karyawan",
  fresh_graduate: "Fresh Graduate",
};

const featuredCourses: CourseProduct[] = [
  {
    title: "Career Growth Sprint",
    slug: "career-growth-sprint",
    category: "Career",
    price: 299000,
    level: "Beginner",
    lessons: 18,
    duration: "4 minggu",
    outcome: "Bangun roadmap karir, skill matrix, dan portfolio evidence yang siap dipantau.",
    accent: "bg-gradient-to-br from-brand-primary-hover via-brand-primary to-brand-border-strong",
  },
  {
    title: "AI Productivity for Work",
    slug: "ai-productivity-for-work",
    category: "AI Tools",
    price: 349000,
    level: "Intermediate",
    lessons: 22,
    duration: "5 minggu",
    outcome: "Gunakan AI untuk riset, dokumen kerja, ide konten, dan workflow harian.",
    accent: "bg-gradient-to-br from-brand-primary-dark via-brand-primary-hover to-brand-accent",
  },
  {
    title: "Digital Marketing Launchpad",
    slug: "digital-marketing-launchpad",
    category: "Marketing",
    price: 399000,
    level: "Project based",
    lessons: 26,
    duration: "6 minggu",
    outcome: "Rancang campaign, landing page, funnel, dan report performa untuk bisnis.",
    accent: "bg-gradient-to-br from-brand-primary-deep via-brand-primary to-brand-border",
  },
];

const upcomingWebinars: WebinarProduct[] = [
  {
    title: "Bangun Personal Branding LinkedIn",
    slug: "bangun-personal-branding-linkedin",
    date: "24 Jun 2026",
    time: "19.30 WIB",
    seats: 80,
    price: 49000,
    speaker: "Nadia Rahma",
    topic: "Career growth",
  },
  {
    title: "Strategi Jualan Course Pertama",
    slug: "strategi-jualan-course-pertama",
    date: "29 Jun 2026",
    time: "20.00 WIB",
    seats: 120,
    price: 79000,
    speaker: "Raka Pratama",
    topic: "Creator business",
  },
  {
    title: "AI Workflow untuk Admin & Founder",
    slug: "ai-workflow-untuk-admin-founder",
    date: "03 Jul 2026",
    time: "19.00 WIB",
    seats: 100,
    price: 59000,
    speaker: "Dimas Arya",
    topic: "AI operations",
  },
];

const checkoutSteps = [
  { title: "Pilih produk", body: "User memilih course evergreen atau webinar terjadwal dari katalog." },
  { title: "Checkout", body: "Sistem menyiapkan order, status pembayaran, dan kuota webinar." },
  { title: "Akses aktif", body: "Setelah paid, course masuk dashboard dan webinar membuka link meeting." },
  { title: "Pantau progress", body: "Admin melihat peserta, progress, assessment, dan feedback mentor." },
];

const businessFeatures = [
  "Katalog course dan webinar",
  "Dashboard pembelian user",
  "Akses materi setelah bayar",
  "Kuota dan jadwal webinar",
  "Assessment dan roadmap belajar",
  "Admin panel untuk operasional",
];

export default function HomePage() {
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPublicData() {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

      try {
        setError("");
        const response = await fetch(`${baseUrl}/public-summary`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          setError("Data realtime belum bisa dimuat dari backend.");
          return;
        }

        setData(await response.json());
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, []);

  const liveMetrics = useMemo(
    () => [
      { label: "Course siap jual", value: data?.career_goals ?? featuredCourses.length },
      { label: "Webinar aktif", value: upcomingWebinars.length },
      { label: "Skill terukur", value: data?.skills },
      { label: "Profil belajar", value: data?.active_profiles },
    ],
    [data],
  );

  return (
    <main className="min-h-screen bg-brand-panel-soft text-brand-text">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-brand-border bg-gradient-to-b from-brand-surface-hero via-brand-surface to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:py-16">
          <div className="animate-hero-rise">
            <div className="inline-flex max-w-full items-start gap-2 rounded-lg border border-brand-border-strong bg-white px-3 py-2 text-sm font-semibold leading-5 text-brand-primary-dark shadow-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
              Platform jualan course, webinar, dan roadmap belajar
            </div>
            <h1 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.08] text-brand-text sm:text-5xl md:text-6xl">
              Jual course dan webinar dari satu sistem GrowTrack.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-muted">
              GrowTrack sekarang diarahkan sebagai platform edukasi: user bisa beli course,
              daftar webinar, akses materi, mengikuti assessment, dan melihat progress belajar.
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <Link
                href="/register"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white shadow-brand-button transition hover:-translate-y-1 hover:bg-brand-primary-hover hover:shadow-brand-button-hover active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                Mulai Jualan
              </Link>
              <Link
                href="#kursus"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-brand-border-strong bg-white px-5 text-sm font-bold text-brand-primary-dark transition hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-surface active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                Lihat Katalog
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {liveMetrics.map((metric) => (
                <LiveMetric key={metric.label} label={metric.label} value={metric.value} loading={loading && metric.value === undefined} />
              ))}
            </div>

            {error ? <InlineNotice message={error} /> : null}
            {data?.updated_at ? (
              <p className="mt-3 text-xs font-semibold text-brand-muted-light">
                Sinkron terakhir {new Date(data.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : null}
          </div>

          <div className="animate-hero-panel relative min-w-0">
            <div className="relative overflow-hidden rounded-lg border border-brand-border bg-white p-2 shadow-brand-hero transition hover:-translate-y-1 hover:shadow-brand-hero-hover">
              <Image
                src="/images/growtrack-hero-dashboard.png"
                alt="Tampilan dashboard GrowTrack untuk course, webinar, dan progress belajar"
                width={1536}
                height={1024}
                priority
                className="aspect-[4/3] w-full rounded-lg object-cover sm:aspect-[16/10] lg:aspect-[4/3]"
              />
            </div>
            <div className="absolute bottom-5 left-5 hidden max-w-[250px] rounded-lg border border-brand-border bg-white/95 p-4 shadow-brand-float backdrop-blur sm:block">
              <p className="text-sm font-bold">Revenue flow</p>
              <p className="mt-1 text-3xl font-black text-brand-primary">Course + Webinar</p>
              <p className="mt-1 text-xs font-semibold text-brand-muted">checkout, akses, dan progress dalam satu dashboard</p>
            </div>
          </div>
        </div>
      </section>

      <section id="kursus" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 sm:px-5">
        <SectionHeader
          eyebrow="Course Catalog"
          title="Produk course yang bisa langsung dijadikan etalase"
          action={<Link href="/admin/master-data" className="text-sm font-bold text-brand-primary-dark hover:text-brand-primary">Kelola produk</Link>}
        />
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <CourseCard key={course.title} course={course} />
          ))}
        </div>
      </section>

      <section id="webinar" className="border-y border-brand-border bg-brand-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5">
          <SectionHeader eyebrow="Live Webinar" title="Jadwal webinar dengan kuota dan harga jelas" />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {upcomingWebinars.map((webinar) => (
              <WebinarCard key={webinar.title} webinar={webinar} />
            ))}
          </div>
        </div>
      </section>

      <section id="kategori" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-5">
        <SectionHeader eyebrow="Kategori Belajar" title="Kategori skill dari database tetap bisa jadi koleksi course" />
        {loading ? (
          <CardSkeletonGrid />
        ) : data?.skill_categories.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.skill_categories.map((category) => (
              <article key={category.category} className="animate-feature-card rounded-lg border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-brand-card-soft">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary-dark text-sm font-black text-white shadow-brand-logo-strong">
                  {category.category.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="mt-4 text-lg font-bold">{category.category}</h3>
                <p className="mt-2 text-sm font-semibold text-brand-muted">{category.skill_count} skill siap dipetakan</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada kategori skill" body="Tambahkan skill dari halaman Admin agar kategori course tampil di sini." />
        )}
      </section>

      <section id="cara-beli" className="border-y border-brand-border bg-brand-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-primary">Order Flow</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Alur sistem jualannya sudah jelas dari katalog sampai akses.</h2>
            <p className="mt-4 text-base leading-7 text-brand-muted">
              Versi MVP bisa dimulai dari checkout sederhana dan status pembayaran manual. Setelah itu baru naik ke payment gateway.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {businessFeatures.map((feature) => (
                <div key={feature} className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-bold text-brand-text-soft shadow-sm">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {checkoutSteps.map((step, index) => (
              <article key={step.title} className="animate-feature-card rounded-lg border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-brand-card-subtle">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-primary-hover text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto grid max-w-7xl scroll-mt-28 gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-brand-primary">Learning Engine</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Roadmap dan assessment lama tetap jadi nilai jual.</h2>
          <p className="mt-4 text-base leading-7 text-brand-muted">
            Course tidak cuma berisi video. Setiap produk bisa punya roadmap, assessment skill, project evidence, dan feedback mentor.
          </p>
        </div>
        <div className="grid gap-4">
          {loading ? (
            <CardSkeletonGrid columns="sm:grid-cols-2" />
          ) : data && (data.roadmap_preview.length || data.assessment_preview.length) ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.roadmap_preview.map((module) => (
                  <article key={module.id} className="animate-feature-card rounded-lg border border-brand-border bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-brand-primary">#{module.sequence} {module.module_type}</p>
                    <h3 className="mt-3 text-lg font-bold">{module.title}</h3>
                    <p className="mt-1 text-xs font-bold text-brand-muted-light">{module.career_goal} - {module.duration_hours} jam</p>
                    <p className="mt-3 text-sm leading-6 text-brand-muted">{module.outcome}</p>
                  </article>
                ))}
              </div>
              {data.assessment_preview.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.assessment_preview.map((assessment) => (
                    <article key={assessment.id} className="animate-feature-card rounded-lg border border-brand-border bg-brand-surface p-5">
                      <p className="text-sm font-black text-brand-primary-dark">{audienceLabel[assessment.audience]}</p>
                      <h3 className="mt-3 text-lg font-bold">{assessment.title}</h3>
                      <p className="mt-1 text-xs font-bold text-brand-muted-light">{assessment.question_count} pertanyaan</p>
                      <p className="mt-3 text-sm leading-6 text-brand-muted">{assessment.description}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState title="Belum ada roadmap atau assessment" body="Tambahkan roadmap module dan assessment template dari Admin." />
          )}
        </div>
      </section>

      <section id="mentor" className="bg-gradient-to-br from-brand-primary-deep via-brand-primary-dark to-brand-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-white/80">Mentor Feedback</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Tambahkan nilai premium lewat review mentor.</h2>
            <p className="mt-4 text-base leading-7 text-white/85">
              Produk berbayar bisa naik kelas dengan feedback, score, dan rekomendasi yang tersimpan di database.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 items-center rounded-lg bg-white px-5 text-sm font-bold text-brand-primary-dark transition hover:-translate-y-0.5"
            >
              Masuk Dashboard
            </Link>
          </div>
          <div className="grid gap-4">
            {loading ? (
              <DarkSkeletonList />
            ) : data?.mentor_feedback.length ? (
              data.mentor_feedback.map((feedback) => (
                <article key={feedback.id} className="rounded-lg border border-white/25 bg-white/10 p-5 shadow-brand-dark-card backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-sm font-black text-brand-primary-dark">
                        {feedback.mentor_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold">{feedback.mentor_name}</h3>
                        <p className="mt-1 text-sm leading-5 text-white/80">{feedback.career_goal}</p>
                      </div>
                    </div>
                    <p className="shrink-0 rounded-md bg-white px-3 py-1 text-sm font-black text-brand-primary-dark">{feedback.score}</p>
                  </div>
                  <p className="mt-4 text-sm font-bold">{feedback.recommendation}</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{feedback.notes}</p>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-white/25 bg-white/10 p-5">
                <p className="font-bold">Belum ada feedback mentor</p>
                <p className="mt-2 text-sm leading-6 text-white/80">Feedback akan tampil setelah mentor mengisi penilaian.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5">
        <div className="grid gap-6 rounded-lg border border-brand-border bg-white p-6 shadow-brand-cta md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-primary">Siap launch?</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Mulai dari katalog, checkout manual, lalu scale ke payment gateway.</h2>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-brand-primary-hover active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            Register Gratis
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-brand-primary">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-brand-text sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function CourseCard({ course }: { course: CourseProduct }) {
  return (
    <article className="animate-feature-card overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-brand-card">
      <div className={`${course.accent} min-h-40 p-5 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-white px-3 py-1 text-xs font-bold text-brand-text">{course.category}</span>
          <span className="rounded-md bg-white/20 px-3 py-1 text-xs font-bold">{course.level}</span>
        </div>
        <h3 className="mt-8 text-xl font-bold leading-tight">{course.title}</h3>
        <p className="mt-2 text-sm font-semibold text-white/80">{course.duration} - {course.lessons} materi</p>
      </div>
      <div className="p-5">
        <p className="text-2xl font-black text-brand-primary">{formatRupiah(course.price)}</p>
        <p className="mt-3 min-h-18 text-sm leading-6 text-brand-muted">{course.outcome}</p>
        <Link
          href={`/checkout/${course.slug}`}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-text px-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-brand-primary-dark active:translate-y-0 active:scale-[0.98]"
        >
          Beli Course
        </Link>
      </div>
    </article>
  );
}

function WebinarCard({ webinar }: { webinar: WebinarProduct }) {
  return (
    <article className="animate-feature-card rounded-lg border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-brand-card-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-brand-primary-dark">{webinar.topic}</p>
          <h3 className="mt-2 text-lg font-bold leading-tight">{webinar.title}</h3>
        </div>
        <span className="shrink-0 rounded-md bg-brand-surface-strong px-3 py-1 text-xs font-black text-brand-primary-dark">{webinar.seats} seat</span>
      </div>
      <div className="mt-5 grid gap-2 text-sm font-semibold text-brand-muted">
        <p>{webinar.date}</p>
        <p>{webinar.time}</p>
        <p>Mentor: {webinar.speaker}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xl font-black text-brand-primary">{formatRupiah(webinar.price)}</p>
        <Link href={`/checkout/${webinar.slug}`} className="inline-flex h-10 items-center rounded-lg bg-brand-primary-dark px-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]">
          Daftar
        </Link>
      </div>
    </article>
  );
}

function LiveMetric({ label, value, loading }: { label: string; value?: number; loading: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-brand-border bg-white p-3 shadow-sm">
      {loading ? <div className="h-7 w-10 animate-pulse rounded bg-brand-surface-glow" /> : <p className="text-2xl font-bold leading-none text-brand-primary">{value ?? 0}</p>}
      <p className="mt-2 text-xs font-semibold leading-4 text-brand-muted">{label}</p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-brand-border-strong bg-white p-5">
      <p className="font-bold text-brand-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p>
    </div>
  );
}

function InlineNotice({ message }: { message: string }) {
  return (
    <p className="mt-3 rounded-lg border border-brand-border-strong bg-white px-3 py-2 text-sm font-semibold text-brand-primary-dark">
      {message}
    </p>
  );
}

function CardSkeletonGrid({ columns = "sm:grid-cols-2 lg:grid-cols-4" }: { columns?: string }) {
  return (
    <div className={`mt-6 grid gap-4 ${columns}`}>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="min-h-32 animate-pulse rounded-lg border border-brand-border bg-white p-5">
          <div className="h-10 w-10 rounded-lg bg-brand-surface-glow" />
          <div className="mt-5 h-4 w-2/3 rounded bg-brand-surface-glow" />
          <div className="mt-3 h-3 w-1/2 rounded bg-brand-surface-glow" />
        </div>
      ))}
    </div>
  );
}

function DarkSkeletonList() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div key={item} className="min-h-24 animate-pulse rounded-lg border border-white/25 bg-white/10 p-5">
          <div className="h-5 w-1/3 rounded bg-white/30" />
          <div className="mt-4 h-3 w-2/3 rounded bg-white/20" />
        </div>
      ))}
    </>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
