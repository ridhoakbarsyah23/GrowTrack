"use client";

import Link from "next/link";
import {
  AdminShell,
  LoadingAdmin,
  QuickLink,
  useAdminData,
} from "./AdminShared";

export default function AdminOverviewPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const hasGoals = data.career_goals.length > 0;
  const hasSkills = data.skills.length > 0;
  const hasTemplates = data.assessment_templates.length > 0;
  const hasTargets = data.skill_targets.length > 0;
  const hasQuestions = data.assessment_questions.length > 0;
  const hasRoadmap = data.roadmap_modules.length > 0;
  const hasUsers = data.users.some((user) => user.role !== "admin");
  const completedSetup = [
    hasGoals,
    hasSkills,
    hasTemplates,
    hasTargets,
    hasQuestions,
    hasRoadmap,
    hasUsers,
  ].filter(Boolean).length;
  const setupProgress = Math.round((completedSetup / 7) * 100);

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Dashboard admin untuk memantau kesiapan sistem."
      eyebrow="Admin Overview"
      body="Ikuti status setup di bawah ini untuk memastikan user bisa register, mengerjakan assessment, dan melihat career journey dengan data realtime."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Setup Status
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{setupProgress}% siap digunakan</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                {setupProgress === 100
                  ? "Konfigurasi utama sudah lengkap. Admin bisa lanjut memantau data user dan report."
                  : "Lengkapi item yang belum selesai supaya pengalaman user berjalan utuh."}
              </p>
            </div>
            <span className="rounded-md bg-brand-surface-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark">
              {completedSetup}/7 selesai
            </span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-sm bg-brand-surface-glow">
            <div
              className="h-full rounded-sm bg-brand-primary-dark transition-all duration-700 ease-out"
              style={{ width: `${setupProgress}%` }}
            />
          </div>
          <div className="mt-5 grid gap-3">
            <CheckStep done={hasGoals} title="Career goal tersedia" body="Dibutuhkan agar user bisa memilih jalur karir saat register." />
            <CheckStep done={hasSkills} title="Skill catalog tersedia" body="Dibutuhkan untuk membaca skill yang akan dinilai." />
            <CheckStep done={hasTemplates} title="Assessment template tersedia" body="Dibutuhkan sebagai wadah pertanyaan assessment." />
            <CheckStep done={hasTargets} title="Target skill terhubung" body="Dibutuhkan agar sistem bisa menghitung gap per career goal." />
            <CheckStep done={hasQuestions} title="Pertanyaan assessment tersedia" body="Dibutuhkan supaya user bisa mengisi assessment." />
            <CheckStep done={hasRoadmap} title="Roadmap tersedia" body="Dibutuhkan untuk modul pengembangan user." />
            <CheckStep done={hasUsers} title="User non-admin tersedia" body="Dibutuhkan untuk memantau career journey sebenarnya." />
          </div>
        </section>

        <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5 [animation-delay:100ms]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Aksi Cepat
          </p>
          <h2 className="mt-2 text-xl font-semibold">Pilih pekerjaan admin berikutnya</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Gunakan kartu ini untuk masuk ke halaman yang sesuai. Setiap halaman sudah dipisah agar input tidak menumpuk.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickLink href="/admin/master-data" title="Isi Master Data" body="Career goal, skill, assessment template, dan roadmap." />
            <QuickLink href="/admin/assessment-setup" title="Atur Assessment" body="Target skill dan pertanyaan yang dipakai user." />
            <QuickLink href="/admin/users" title="Kelola User" body="Buat akun user dan hubungkan ke career goal." />
            <QuickLink href="/admin/orders" title="Approve Order" body="Cek pembayaran manual course dan webinar." />
            <QuickLink href="/admin/preview" title="Cek Data Masuk" body="Pastikan konfigurasi sudah tersimpan dengan benar." />
          </div>
          <NextAction
            hasGoals={hasGoals}
            hasSkills={hasSkills}
            hasTemplates={hasTemplates}
            hasTargets={hasTargets}
            hasQuestions={hasQuestions}
            hasRoadmap={hasRoadmap}
            hasUsers={hasUsers}
          />
        </section>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5 [animation-delay:160ms]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Setup Guide
          </p>
          <h2 className="mt-2 text-xl font-semibold">Urutan input yang disarankan</h2>
          <div className="mt-4 grid gap-3">
            <SetupStep number="1" title="Career goal" body="Buat jalur promosi atau kesiapan kerja." />
            <SetupStep number="2" title="Skill" body="Masukkan skill yang perlu diukur." />
            <SetupStep number="3" title="Target skill" body="Hubungkan skill dengan career goal." />
            <SetupStep number="4" title="Assessment" body="Buat template dan pertanyaan." />
            <SetupStep number="5" title="Roadmap" body="Tambahkan modul pengembangan." />
            <SetupStep number="6" title="User" body="Buat akun atau arahkan user register." />
          </div>
        </section>

        <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5 [animation-delay:220ms]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Kondisi Data
          </p>
          <h2 className="mt-2 text-xl font-semibold">Apa yang sudah masuk?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DataStatus label="Career goals" value={data.career_goals.length} hint="Jalur karir yang bisa dipilih user." />
            <DataStatus label="Skills" value={data.skills.length} hint="Skill yang akan dinilai dan dipantau." />
            <DataStatus label="Templates" value={data.assessment_templates.length} hint="Template assessment aktif." />
            <DataStatus label="Questions" value={data.assessment_questions.length} hint="Pertanyaan assessment yang tersedia." />
            <DataStatus label="Roadmap" value={data.roadmap_modules.length} hint="Modul pengembangan user." />
            <DataStatus label="Users" value={data.users.length} hint="Akun yang bisa login ke sistem." />
          </div>
        </section>
      </section>
    </AdminShell>
  );
}

function CheckStep({ done, title, body }: { done: boolean; title: string; body: string }) {
  return (
    <div className="group grid grid-cols-[36px_1fr] gap-3 rounded-lg border border-brand-border bg-brand-panel-soft p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div
        className={`grid h-9 w-9 place-items-center rounded-md text-sm font-semibold transition group-hover:scale-105 ${
          done ? "bg-brand-primary-dark text-white" : "bg-status-warning-bg text-status-warning-text"
        }`}
      >
        {done ? "✓" : "!"}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-5 text-brand-muted">{body}</p>
      </div>
    </div>
  );
}

function NextAction({
  hasGoals,
  hasSkills,
  hasTemplates,
  hasTargets,
  hasQuestions,
  hasRoadmap,
  hasUsers,
}: {
  hasGoals: boolean;
  hasSkills: boolean;
  hasTemplates: boolean;
  hasTargets: boolean;
  hasQuestions: boolean;
  hasRoadmap: boolean;
  hasUsers: boolean;
}) {
  let title = "Pantau data yang sudah masuk";
  let body = "Konfigurasi utama sudah lengkap. Cek preview data dan dashboard user secara berkala.";
  let href = "/admin/preview";

  if (!hasGoals || !hasSkills || !hasTemplates || !hasRoadmap) {
    title = "Mulai dari master data";
    body = "Lengkapi career goal, skill, template assessment, dan roadmap terlebih dahulu.";
    href = "/admin/master-data";
  } else if (!hasTargets || !hasQuestions) {
    title = "Lengkapi assessment setup";
    body = "Hubungkan target skill dan buat pertanyaan agar assessment bisa digunakan.";
    href = "/admin/assessment-setup";
  } else if (!hasUsers) {
    title = "Tambahkan user pertama";
    body = "Buat akun employee atau fresh graduate agar career journey bisa dipantau.";
    href = "/admin/users";
  }

  return (
    <div className="mt-5 rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-primary-dark">Rekomendasi berikutnya</p>
          <h3 className="mt-1 text-lg font-semibold">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">{body}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]"
        >
          Buka halaman
          <span aria-hidden="true">
            <ArrowIcon />
          </span>
        </Link>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function DataStatus({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${value ? "bg-brand-surface-strong text-brand-primary-dark" : "bg-status-warning-bg text-status-warning-text"}`}>
          {value ? "Terisi" : "Kosong"}
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-brand-primary-dark">{value}</p>
      <p className="mt-2 text-sm leading-5 text-brand-muted">{hint}</p>
    </div>
  );
}

function SetupStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3 rounded-lg bg-brand-surface p-3 transition hover:-translate-y-0.5 hover:bg-brand-surface-strong">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-primary-dark text-sm font-semibold text-white">
        {number}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-5 text-brand-muted">{body}</p>
      </div>
    </div>
  );
}
