"use client";

import Link from "next/link";
import {
  AdminShell,
  LoadingAdmin,
  type AdminData,
  useAdminData,
} from "../AdminShared";

type SetupItem = {
  key: string;
  title: string;
  body: string;
  done: boolean;
  count: number;
  href: string;
  action: string;
  dependency?: string;
};

type QaItem = {
  title: string;
  body: string;
  href: string;
  action: string;
  ready: boolean;
  blocker?: string;
};

export default function AdminSetupPage() {
  const { data, message, error, loading, loadData } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  const items = buildSetupItems(data);
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);
  const nextItem = items.find((item) => !item.done);
  const qaItems = buildQaItems(data);

  return (
    <AdminShell
      title="Setup wizard untuk menyiapkan Pathly AI."
      eyebrow="Setup Wizard"
      body="Ikuti urutan ini agar register, assessment, skill gap, roadmap, produk, dan user journey berjalan dengan data yang lengkap."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Progress</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold text-brand-primary-dark">{progress}%</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                {completed} dari {items.length} langkah utama sudah siap.
              </p>
            </div>
            <span className="rounded-md bg-brand-surface-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark">
              {nextItem ? "Masih perlu setup" : "Siap dipakai"}
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-sm bg-brand-surface-glow">
            <div className="h-full rounded-sm bg-brand-primary-dark transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-5 rounded-lg border border-brand-border bg-brand-panel-soft p-4">
            <p className="text-sm font-semibold text-brand-primary-dark">Langkah berikutnya</p>
            <h2 className="mt-1 text-xl font-semibold">{nextItem?.title ?? "Cek preview dan mulai operasional"}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              {nextItem?.body ?? "Konfigurasi utama sudah lengkap. Lanjut cek data, buat user percobaan, dan tes alur end-to-end."}
            </p>
            <Link
              href={nextItem?.href ?? "/admin/preview"}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]"
            >
              {nextItem?.action ?? "Buka Preview"}
            </Link>
          </div>
          <Link
            href="/admin/import"
            className="mt-3 inline-flex h-10 items-center rounded-md border border-brand-border-strong px-4 text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98]"
          >
            Import template master data
          </Link>
        </section>

        <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Checklist</p>
          <div className="mt-4 grid gap-3">
            {items.map((item, index) => (
              <SetupRow key={item.key} item={item} index={index + 1} />
            ))}
          </div>
        </section>
      </section>

      <section className="mt-5 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Manual QA</p>
            <h2 className="mt-2 text-xl font-semibold">Checklist sebelum demo atau deploy</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
              Jalankan urutan ini setelah setup data selesai untuk memastikan user journey berjalan dari halaman publik sampai dashboard.
            </p>
          </div>
          <span className="rounded-md bg-brand-surface-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark">
            {qaItems.filter((item) => item.ready).length}/{qaItems.length} siap
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {qaItems.map((item, index) => (
            <TestCard key={item.title} item={item} index={index + 1} />
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function buildSetupItems(data: AdminData): SetupItem[] {
  const hasGoals = data.career_goals.length > 0;
  const hasSkills = data.skills.length > 0;
  const hasTemplates = data.assessment_templates.length > 0;
  const hasTargets = data.skill_targets.length > 0;
  const hasQuestions = data.assessment_questions.length > 0;
  const hasRoadmap = data.roadmap_modules.length > 0;
  const hasProducts = data.learning_products.length > 0;
  const hasLearners = data.users.some((user) => ["student", "fresh_graduate", "employee"].includes(user.role));

  return [
    {
      key: "career-goals",
      title: "Career goals",
      body: "Jalur karier yang dipilih user saat register dan dipakai dashboard.",
      done: hasGoals,
      count: data.career_goals.length,
      href: "/admin/master-data",
      action: "Kelola Master Data",
    },
    {
      key: "skills",
      title: "Skill catalog",
      body: "Daftar skill yang dipakai assessment, skill gap, dan roadmap.",
      done: hasSkills,
      count: data.skills.length,
      href: "/admin/master-data",
      action: "Kelola Skill",
    },
    {
      key: "skill-targets",
      title: "Target skill",
      body: "Target score per career goal agar gap kompetensi bisa dihitung.",
      done: hasTargets,
      count: data.skill_targets.length,
      href: "/admin/assessment-setup",
      action: "Atur Target",
      dependency: hasGoals && hasSkills ? undefined : "Butuh career goals dan skills.",
    },
    {
      key: "assessment-templates",
      title: "Assessment templates",
      body: "Wadah assessment untuk audience mahasiswa, fresh graduate, atau employee.",
      done: hasTemplates,
      count: data.assessment_templates.length,
      href: "/admin/master-data",
      action: "Kelola Template",
    },
    {
      key: "assessment-questions",
      title: "Assessment questions",
      body: "Pertanyaan yang mengukur skill dan menghasilkan readiness score.",
      done: hasQuestions,
      count: data.assessment_questions.length,
      href: "/admin/assessment-setup",
      action: "Kelola Pertanyaan",
      dependency: hasTemplates && hasSkills ? undefined : "Butuh assessment templates dan skills.",
    },
    {
      key: "roadmap",
      title: "Roadmap modules",
      body: "Modul belajar yang akan diprioritaskan berdasarkan skill gap user.",
      done: hasRoadmap,
      count: data.roadmap_modules.length,
      href: "/admin/master-data",
      action: "Kelola Roadmap",
      dependency: hasGoals ? undefined : "Butuh career goals.",
    },
    {
      key: "products",
      title: "Products",
      body: "Course atau webinar yang bisa ditampilkan di katalog dan checkout.",
      done: hasProducts,
      count: data.learning_products.length,
      href: "/admin/products",
      action: "Kelola Produk",
    },
    {
      key: "learners",
      title: "Learner users",
      body: "User non-admin untuk mencoba journey sebenarnya dari register sampai dashboard.",
      done: hasLearners,
      count: data.users.filter((user) => ["student", "fresh_graduate", "employee"].includes(user.role)).length,
      href: "/admin/users",
      action: "Kelola User",
      dependency: hasGoals ? undefined : "Butuh career goals.",
    },
  ];
}

function buildQaItems(data: AdminData): QaItem[] {
  const hasGoals = data.career_goals.length > 0;
  const hasTemplates = data.assessment_templates.length > 0;
  const hasQuestions = data.assessment_questions.length > 0;
  const hasRoadmap = data.roadmap_modules.length > 0;
  const activeProducts = data.learning_products.filter((product) => product.status === "active").length;
  const hasManualPayment = Boolean(data.settings.manual_payment_instructions?.trim());

  return [
    {
      title: "Register user baru",
      body: "Buka halaman register, pilih role, pilih career goal, lalu pastikan user diarahkan ke assessment.",
      href: "/register",
      action: "Tes Register",
      ready: hasGoals,
      blocker: hasGoals ? undefined : "Butuh career goal aktif.",
    },
    {
      title: "Submit assessment",
      body: "Isi semua pertanyaan, submit, lalu cek career profile dan skill gap muncul di hasil assessment.",
      href: "/assessment",
      action: "Tes Assessment",
      ready: hasTemplates && hasQuestions,
      blocker: hasTemplates && hasQuestions ? undefined : "Butuh template dan pertanyaan assessment.",
    },
    {
      title: "Cek dashboard user",
      body: "Pastikan readiness, skill gap, roadmap prioritas, dan coach insight tampil dari data terbaru.",
      href: "/dashboard",
      action: "Tes Dashboard",
      ready: hasGoals && hasRoadmap,
      blocker: hasGoals && hasRoadmap ? undefined : "Butuh career goal dan roadmap module.",
    },
    {
      title: "Checkout produk",
      body: "Buka produk aktif dari halaman publik, buat order, lalu approve pembayaran dari Admin Orders.",
      href: "/#assessment",
      action: "Tes Checkout",
      ready: activeProducts > 0 && hasManualPayment,
      blocker: activeProducts > 0
        ? hasManualPayment ? undefined : "Isi instruksi pembayaran manual dulu."
        : "Butuh minimal 1 produk active.",
    },
  ];
}

function SetupRow({ item, index }: { item: SetupItem; index: number }) {
  return (
    <div className="grid gap-3 rounded-lg border border-brand-border bg-brand-panel-soft p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm md:grid-cols-[44px_1fr_auto] md:items-center">
      <div className={`grid h-11 w-11 place-items-center rounded-md text-sm font-semibold ${item.done ? "bg-brand-primary-dark text-white" : "bg-status-warning-bg text-status-warning-text"}`}>
        {item.done ? "OK" : index}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{item.title}</h2>
          <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-brand-primary-dark">{item.count} data</span>
        </div>
        <p className="mt-1 text-sm leading-5 text-brand-muted">{item.body}</p>
        {item.dependency ? <p className="mt-2 text-xs font-semibold text-status-warning-text">{item.dependency}</p> : null}
      </div>
      <Link
        href={item.href}
        className="inline-flex h-10 items-center justify-center rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98]"
      >
        {item.action}
      </Link>
    </div>
  );
}

function TestCard({ item, index }: { item: QaItem; index: number }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{index}. {item.title}</p>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.ready ? "bg-brand-primary-dark text-white" : "bg-status-warning-bg text-status-warning-text"}`}>
          {item.ready ? "Siap dites" : "Belum siap"}
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-brand-muted">{item.body}</p>
      {item.blocker ? <p className="mt-3 text-xs font-semibold text-status-warning-text">{item.blocker}</p> : null}
      <Link
        href={item.href}
        className="mt-4 inline-flex h-10 items-center rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:scale-[0.98]"
      >
        {item.action}
      </Link>
    </div>
  );
}
