"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PublicNav } from "./components/PublicNav";

type Audience = "student" | "employee" | "fresh_graduate";

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

type LearningProduct = {
  id: number;
  type: "course" | "webinar";
  title: string;
  slug: string;
  category: string;
  level: string | null;
  price: number;
  description: string;
  outcome: string;
  lesson_count: number;
  duration: string | null;
  scheduled_at: string | null;
  seat_limit: number | null;
  status: "active" | "inactive";
};

const audienceLabel: Record<Audience, string> = {
  student: "Mahasiswa",
  employee: "Karyawan",
  fresh_graduate: "Fresh Graduate",
};

const checkoutSteps = [
  { title: "Assessment", body: "Pengguna mengisi pendidikan, pengalaman, skill, minat, dan target karier." },
  { title: "Skill gap", body: "Sistem membandingkan skill saat ini dengan kompetensi target karier." },
  { title: "Roadmap", body: "Modul belajar dan proyek disusun menjadi urutan pengembangan yang jelas." },
  { title: "Progress", body: "Dashboard memantau readiness, evidence, dan feedback mentor secara berkala." },
];

const businessFeatures = [
  "Career Profile",
  "Skill Gap Analysis",
  "Personalized Roadmap",
  "Progress Tracking",
  "Project Evidence",
  "Mentor Feedback",
];

export default function HomePage() {
  const [data, setData] = useState<PublicData | null>(null);
  const [products, setProducts] = useState<LearningProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const authToken = useSyncExternalStore(subscribeToAuthToken, getAuthTokenSnapshot, getServerAuthTokenSnapshot);

  useEffect(() => {
    async function loadPublicData() {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

      try {
        setError("");
        const [summaryResponse, productsResponse] = await Promise.all([
          fetch(`${baseUrl}/public-summary`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
          fetch(`${baseUrl}/products`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

        if (!summaryResponse.ok || !productsResponse.ok) {
          setError("Data realtime belum bisa dimuat dari backend.");
          return;
        }

        const summaryPayload = await summaryResponse.json();
        const productsPayload = await productsResponse.json();

        setData(summaryPayload);
        setProducts(productsPayload.products ?? []);
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, []);

  const courseProducts = useMemo(
    () => products.filter((product) => product.type === "course"),
    [products],
  );
  const webinarProducts = useMemo(
    () => products.filter((product) => product.type === "webinar"),
    [products],
  );
  const liveMetrics = useMemo(
    () => [
      { label: "Rekomendasi belajar", value: courseProducts.length },
      { label: "Live activity", value: webinarProducts.length },
      { label: "Skill terukur", value: data?.skills },
      { label: "Career profile", value: data?.active_profiles },
    ],
    [courseProducts.length, data, webinarProducts.length],
  );
  const primaryCtaHref = authToken ? "/dashboard" : "/register";
  const primaryCtaLabel = authToken ? "Buka Dashboard" : "Buat Career Profile";

  return (
    <main className="min-h-screen bg-brand-panel-soft text-brand-text">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-brand-border bg-gradient-to-b from-brand-surface-hero via-brand-surface to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:py-16">
          <div className="animate-hero-rise">
            <div className="inline-flex max-w-full items-start gap-2 rounded-lg border border-brand-border-strong bg-white px-3 py-2 text-sm font-semibold leading-5 text-brand-primary-dark shadow-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
              AI Career Companion untuk perjalanan karier 3-5 tahun
            </div>
            <h1 className="mt-5 max-w-3xl text-[2.35rem] font-bold leading-[1.08] text-brand-text sm:text-5xl md:text-6xl">
              Pathly AI membantu kamu tahu harus belajar apa berikutnya.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-muted">
              Mulai dari career assessment, temukan skill gap, lalu ikuti roadmap
              personal yang membantu mahasiswa, fresh graduate, dan karyawan bergerak lebih terarah.
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <Link
                href={primaryCtaHref}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white shadow-brand-button transition hover:-translate-y-1 hover:bg-brand-primary-hover hover:shadow-brand-button-hover active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                href="#assessment"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-brand-border-strong bg-white px-5 text-sm font-bold text-brand-primary-dark transition hover:-translate-y-1 hover:border-brand-primary hover:bg-brand-surface active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                Lihat Assessment
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
                alt="Tampilan dashboard Pathly AI untuk roadmap, skill gap, dan progress karier"
                width={1536}
                height={1024}
                priority
                className="aspect-[4/3] w-full rounded-lg object-cover sm:aspect-[16/10] lg:aspect-[4/3]"
              />
            </div>
            <div className="absolute bottom-5 left-5 hidden max-w-[250px] rounded-lg border border-brand-border bg-white/95 p-4 shadow-brand-float backdrop-blur sm:block">
              <p className="text-sm font-bold">Career flow</p>
              <p className="mt-1 text-3xl font-black text-brand-primary">Assess + Grow</p>
              <p className="mt-1 text-xs font-semibold text-brand-muted">profile, skill gap, roadmap, dan progress dalam satu dashboard</p>
            </div>
          </div>
        </div>
      </section>

      <section id="assessment" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 sm:px-5">
        <SectionHeader
          eyebrow="Career Assessment"
          title="Mulai dari data diri, kemampuan, minat, dan target karier"
          action={<Link href="/admin/master-data" className="text-sm font-bold text-brand-primary-dark hover:text-brand-primary">Kelola master data</Link>}
        />
        {loading ? (
          <CardSkeletonGrid columns="lg:grid-cols-3" />
        ) : courseProducts.length ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {courseProducts.map((course, index) => (
              <CourseCard key={course.id} course={course} accent={courseAccent(index)} />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada rekomendasi belajar aktif" body="Tambahkan produk course dari halaman Admin Products agar bisa dipakai sebagai rekomendasi." />
        )}
      </section>

      <section id="skill-gap" className="border-y border-brand-border bg-brand-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5">
          <SectionHeader eyebrow="Skill Gap Analysis" title="Rekomendasi aktivitas belajar tetap bisa ditautkan ke gap skill" />
          {loading ? (
            <CardSkeletonGrid columns="lg:grid-cols-3" />
          ) : webinarProducts.length ? (
            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              {webinarProducts.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          ) : (
            <EmptyState title="Belum ada aktivitas rekomendasi aktif" body="Tambahkan webinar dari halaman Admin Products jika ingin memberi rekomendasi live session." />
          )}
        </div>
      </section>

      <section id="kategori" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-5">
        <SectionHeader eyebrow="Skill Library" title="Kategori skill menjadi fondasi pembanding kompetensi" />
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
          <EmptyState title="Belum ada kategori skill" body="Tambahkan skill dari halaman Admin agar skill gap bisa dihitung." />
        )}
      </section>

      <section id="cara-beli" className="border-y border-brand-border bg-brand-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-primary">Order Flow</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Alur sistem jualannya sudah jelas dari katalog sampai akses.</h2>
            <p className="mt-4 text-base leading-7 text-brand-muted">
              Versi MVP sebaiknya memvalidasi alur career profile, assessment, skill gap,
              dan roadmap terlebih dahulu sebelum AI layer dan marketplace diperluas.
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
          <p className="text-sm font-bold text-brand-primary">Roadmap Engine</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Roadmap menjadi langkah konkret dari hasil gap.</h2>
          <p className="mt-4 text-base leading-7 text-brand-muted">
            Setiap target karier punya skill target, modul belajar, evidence project,
            dan feedback mentor agar progres tidak berhenti di rekomendasi umum.
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
            <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">Mulai dari assessment, lalu lanjut ke roadmap personal.</h2>
          </div>
          <Link
            href={primaryCtaHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand-primary px-5 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-brand-primary-hover active:translate-y-0 active:scale-[0.98] sm:w-auto"
          >
            {authToken ? "Buka Dashboard" : "Mulai Assessment"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function subscribeToAuthToken(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getAuthTokenSnapshot() {
  return localStorage.getItem("growtrack_token");
}

function getServerAuthTokenSnapshot() {
  return null;
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

function CourseCard({ course, accent }: { course: LearningProduct; accent: string }) {
  return (
    <article className="animate-feature-card overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-brand-card">
      <div className={`${accent} min-h-40 p-5 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-white px-3 py-1 text-xs font-bold text-brand-text">{course.category}</span>
          <span className="rounded-md bg-white/20 px-3 py-1 text-xs font-bold">{course.level ?? "Course"}</span>
        </div>
        <h3 className="mt-8 text-xl font-bold leading-tight">{course.title}</h3>
        <p className="mt-2 text-sm font-semibold text-white/80">{course.duration ?? "Mandiri"} - {course.lesson_count} materi</p>
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

function WebinarCard({ webinar }: { webinar: LearningProduct }) {
  const schedule = formatSchedule(webinar.scheduled_at);

  return (
    <article className="animate-feature-card rounded-lg border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary hover:shadow-brand-card-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-brand-primary-dark">{webinar.category}</p>
          <h3 className="mt-2 text-lg font-bold leading-tight">{webinar.title}</h3>
        </div>
        <span className="shrink-0 rounded-md bg-brand-surface-strong px-3 py-1 text-xs font-black text-brand-primary-dark">{webinar.seat_limit ?? "-"} seat</span>
      </div>
      <div className="mt-5 grid gap-2 text-sm font-semibold text-brand-muted">
        <p>{schedule.date}</p>
        <p>{schedule.time}</p>
        <p>{webinar.level ?? "Live Session"}</p>
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

function courseAccent(index: number) {
  const accents = [
    "bg-gradient-to-br from-brand-primary-hover via-brand-primary to-brand-border-strong",
    "bg-gradient-to-br from-brand-primary-dark via-brand-primary-hover to-brand-accent",
    "bg-gradient-to-br from-brand-primary-deep via-brand-primary to-brand-border",
  ];

  return accents[index % accents.length];
}

function formatSchedule(value: string | null) {
  if (!value) {
    return { date: "Jadwal menyusul", time: "Waktu menyusul" };
  }

  const date = new Date(value);

  return {
    date: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    time: `${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`,
  };
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
