"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";

type Audience = "employee" | "fresh_graduate";
type Goal = { id: number; audience: Audience; title: string; level: string; summary: string; module_count: number; total_hours: number };
type Skill = { id: number; name: string; category: string; description: string };
type Assessment = { id: number; audience: Audience; title: string; description: string; question_count: number };
type RoadmapModule = { id: number; career_goal: string; sequence: number; title: string; module_type: string; duration_hours: number; outcome: string };
type SkillGap = { skill: string; current_score: number; target_score: number; gap: number };
type RoadmapProgress = {
  id: number;
  roadmap_module_id: number;
  title: string;
  module_type: string;
  duration_hours: number;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  due_date: string | null;
};
type ProjectSubmission = {
  id: number;
  roadmap_module_id: number;
  title: string;
  module_title: string;
  description: string;
  status: string;
  score: number | null;
  created_at: string;
};
type LearningOrder = {
  id: number;
  invoice_number: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  payment_method: string;
  payment_note: string | null;
  paid_at: string | null;
  created_at: string;
  product_id: number;
  type: "course" | "webinar";
  title: string;
  slug: string;
  category: string;
  duration: string | null;
  scheduled_at: string | null;
  meeting_url: string | null;
  material_url: string | null;
};
type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: Audience;
  department: string | null;
  current_position: string;
  target_position: string;
  career_goal: string;
  assessment: { overall_score: number; summary: string | null; skill_gaps: SkillGap[] };
  roadmap_progress_score: number;
  project_evidence_score: number;
  mentor_feedback_score: number;
  readiness_score: number;
  readiness_status: string;
  roadmap_progress: RoadmapProgress[];
  submissions: ProjectSubmission[];
  mentor_feedback: { recommendation: string | null; score: number; notes: string | null };
};

type DashboardData = {
  current_user: { id: number; name: string; email: string; role: string };
  goals: Goal[];
  skills: Skill[];
  roadmap: RoadmapModule[];
  assessments: Assessment[];
  profiles: UserProfile[];
  hr_summary: { total_active_profiles: number; ready_or_almost_ready: number; average_readiness: number; highest_gap: SkillGap | null };
};

const audienceLabel = { employee: "Karyawan", fresh_graduate: "Fresh Graduate" };

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<LearningOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");
  const [journeyMessage, setJourneyMessage] = useState("");
  const [journeyError, setJourneyError] = useState("");

  const loadDashboard = useCallback(async (showLoading = false) => {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      router.replace("/");
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/career-dashboard`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("growtrack_token");
        localStorage.removeItem("growtrack_user");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        setError("Dashboard gagal dimuat dari backend.");
        return;
      }

      setData(await response.json());

      const ordersResponse = await fetch(`${baseUrl}/orders/my`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (ordersResponse.ok) {
        const ordersPayload = await ordersResponse.json();
        setOrders(ordersPayload.orders ?? []);
      }
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  async function updateRoadmapProgress(progress: RoadmapProgress, nextPercent: number) {
    const token = localStorage.getItem("growtrack_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
    const progressPercent = Math.max(0, Math.min(nextPercent, 100));
    const status = progressPercent >= 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started";

    setJourneyMessage("");
    setJourneyError("");

    try {
      const response = await fetch(`${baseUrl}/roadmap-progress/${progress.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          progress_percent: progressPercent,
          due_date: progress.due_date,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setJourneyError(payload.message ?? "Progress gagal diperbarui.");
        return;
      }

      setJourneyMessage(payload.message ?? "Progress berhasil diperbarui.");
      await loadDashboard();
    } catch {
      setJourneyError("Backend belum bisa dihubungi.");
    }
  }

  async function submitProjectEvidence(progressId: number, payload: { title: string; description: string }) {
    const token = localStorage.getItem("growtrack_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    setJourneyMessage("");
    setJourneyError("");

    try {
      const response = await fetch(`${baseUrl}/project-submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roadmap_progress_id: progressId,
          ...payload,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setJourneyError(result.message ?? "Project evidence gagal dikirim.");
        return;
      }

      setJourneyMessage(result.message ?? "Project evidence berhasil dikirim.");
      await loadDashboard();
    } catch {
      setJourneyError("Backend belum bisa dihubungi.");
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    const token = localStorage.getItem("growtrack_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
    const roleLabel = data?.current_user.role === "fresh_graduate" ? "fresh graduate" : "karyawan";

    try {
      if (token) {
        await fetch(`${baseUrl}/logout`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem("growtrack_token");
      localStorage.removeItem("growtrack_user");
      setLogoutOpen(false);
      setLogoutLoading(false);
      setLogoutNotice(`Logout ${roleLabel} berhasil. Mengarahkan ke halaman utama...`);
      window.setTimeout(() => router.replace("/"), 650);
    }
  }

  if (loading) {
    return <CenteredMessage title="Memuat dashboard..." />;
  }

  if (error || !data) {
    return <CenteredMessage title="Dashboard tidak tersedia" body={error} />;
  }

  const featuredProfile = data.profiles[0];
  const secondProfile = data.profiles[1];
  const role = data.current_user.role;
  const isLearner = ["employee", "fresh_graduate"].includes(role);
  const isReviewer = ["admin", "mentor"].includes(role);
  const dashboardTitle = isLearner
    ? `Lanjutkan belajar, ${data.current_user.name}.`
    : "Pantau data karir yang tersimpan di backend.";
  const dashboardBody = isLearner
    ? "Area ini fokus ke akses kelas, progress roadmap, evidence project, dan report readiness kamu."
    : "Angka di dashboard ini berasal dari database. Jika admin menambah career goal, skill, assessment, roadmap, atau user, ringkasan ini ikut berubah setelah refresh.";

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="animate-admin-enter rounded-lg border border-brand-border bg-white p-4 md:sticky md:top-5 md:h-[calc(100vh-40px)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            {isLearner ? "Learning Space" : "Control Dashboard"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">GrowTrack</h1>
          <div className="mt-3 rounded-md bg-brand-surface-strong p-3">
            <p className="text-sm font-semibold">{data.current_user.name}</p>
            <p className="mt-1 text-xs text-brand-primary-dark">{role}</p>
          </div>
          <nav className="mt-6 grid gap-2 text-sm font-medium">
            <a className="rounded-md bg-brand-primary-dark px-3 py-2 text-white" href="#dashboard">
              {isLearner ? "Ringkasan" : "Dashboard"}
            </a>
            <a className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="#kelas-saya">Kelas Saya</a>
            {isLearner ? (
              <a className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="#journey">Journey</a>
            ) : (
              <a className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="#career-goals">Career Data</a>
            )}
            <Link className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="/assessment">Assessment</Link>
            <a className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="#reports">Reports</a>
            {isReviewer ? (
              <Link className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="/evidence-review">Evidence Review</Link>
            ) : null}
            {isReviewer ? (
              <Link className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="/mentor-feedback">Mentor Feedback</Link>
            ) : null}
            {role === "admin" ? (
              <Link className="rounded-md px-3 py-2 text-brand-muted hover:bg-brand-surface-strong" href="/admin">Admin Panel</Link>
            ) : null}
          </nav>
          <button type="button" onClick={() => setLogoutOpen(true)} className="mt-6 h-10 w-full rounded-md border border-brand-border-strong text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong">
            Logout
          </button>
        </aside>

        <div className="grid animate-admin-enter gap-5 [animation-delay:80ms]">
          {logoutNotice ? (
            <p className="animate-toast-in rounded-md border border-brand-border-strong bg-brand-surface-strong px-4 py-3 text-sm text-brand-primary-dark">
              {logoutNotice}
            </p>
          ) : null}
          <section id="dashboard" className="grid gap-4 rounded-lg border border-brand-border bg-brand-surface-strong p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
                {isLearner ? "Learning Dashboard" : "Realtime Dashboard"}
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
                {dashboardTitle}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted">
                {dashboardBody}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {isLearner && featuredProfile ? (
                  <>
                    <Metric label="Readiness" value={featuredProfile.readiness_score} suffix="%" />
                    <Metric label="Roadmap" value={featuredProfile.roadmap_progress_score} suffix="%" />
                    <Metric label="Project" value={featuredProfile.project_evidence_score} suffix="%" />
                    <Metric label="Mentor" value={featuredProfile.mentor_feedback_score} suffix="%" />
                  </>
                ) : (
                  <>
                    <Metric label="Active profiles" value={data.hr_summary.total_active_profiles} />
                    <Metric label="Career goals" value={data.goals.length} />
                    <Metric label="Skills" value={data.skills.length} />
                    <Metric label="Avg readiness" value={data.hr_summary.average_readiness} suffix="%" />
                  </>
                )}
              </div>
            </div>
            {isLearner && featuredProfile ? <LearnerSummary profile={featuredProfile} orders={orders} /> : <LiveSummary data={data} />}
          </section>

          <section id="kelas-saya" className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Learning Access</p>
                <h2 className="mt-2 text-xl font-semibold">Kelas dan Webinar Saya</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Order pending menunggu konfirmasi admin. Setelah status paid, akses materi atau link webinar akan muncul.
                </p>
              </div>
              <Link href="/#kursus" className="rounded-md border border-brand-border-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong">
                Cari kelas
              </Link>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {orders.length ? (
                orders.map((order) => <LearningOrderCard key={order.id} order={order} />)
              ) : (
                <EmptyState title="Belum ada pembelian" body="Pilih course atau webinar dari katalog, lalu buat order checkout." />
              )}
            </div>
          </section>

          {featuredProfile ? (
            <section id="journey" className={`grid gap-4 ${isLearner ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
              <ProfileCard
                profile={featuredProfile}
                canManageJourney={isLearner}
                journeyMessage={journeyMessage}
                journeyError={journeyError}
                onUpdateProgress={updateRoadmapProgress}
                onSubmitEvidence={submitProjectEvidence}
              />
              {isLearner ? null : <HrSummary data={data} />}
            </section>
          ) : (
            <EmptyState title="Belum ada profil karir" body="Masuk ke halaman Admin untuk membuat user employee/fresh graduate dan memilih career goal." />
          )}

          {!isLearner ? (
            <>
              <section id="career-goals" className="grid gap-4 lg:grid-cols-2">
                <Panel title="Career Goals" eyebrow="Goal library">
                  {data.goals.length ? (
                    <div className="grid gap-3">
                      {data.goals.map((goal) => (
                        <article key={goal.id} className="rounded-lg border border-brand-border p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">{audienceLabel[goal.audience]}</p>
                          <h3 className="mt-1 font-semibold">{goal.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-brand-muted">{goal.summary}</p>
                          <p className="mt-3 text-sm font-medium">{goal.module_count} modules, {goal.total_hours} hours</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Belum ada career goal" body="Tambahkan career goal dari halaman Admin." />
                  )}
                </Panel>

                <Panel title="Roadmap Modules" eyebrow="Roadmap">
                  {data.roadmap.length ? (
                    <div className="grid gap-3">
                      {data.roadmap.map((module) => (
                        <article key={module.id} className="rounded-lg border border-brand-border p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">{module.career_goal}</p>
                          <h3 className="mt-1 font-semibold">{module.sequence}. {module.title}</h3>
                          <p className="mt-1 text-xs font-semibold text-brand-primary-dark">{module.module_type} - {module.duration_hours} jam</p>
                          <p className="mt-2 text-sm leading-6 text-brand-muted">{module.outcome}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Belum ada roadmap" body="Tambahkan roadmap module dari halaman Admin." />
                  )}
                </Panel>
              </section>

              <section id="assessment" className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <Panel title="Assessment Templates" eyebrow="Assessment">
                  {data.assessments.length ? (
                    <div className="grid gap-3">
                      {data.assessments.map((assessment) => (
                        <article key={assessment.id} className="rounded-lg border border-brand-border p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">{audienceLabel[assessment.audience]}</p>
                          <h3 className="mt-1 font-semibold">{assessment.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-brand-muted">{assessment.description}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Belum ada assessment" body="Tambahkan template assessment dari halaman Admin." />
                  )}
                </Panel>

                <Panel title="Skill Catalog" eyebrow="Skills">
                  {data.skills.length ? (
                    <div className="grid gap-3">
                      {data.skills.map((skill) => (
                        <article key={skill.id} className="rounded-lg border border-brand-border p-4">
                          <h3 className="font-semibold">{skill.name}</h3>
                          <p className="mt-1 text-xs font-semibold text-brand-primary-dark">{skill.category}</p>
                          <p className="mt-2 text-sm leading-6 text-brand-muted">{skill.description}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Belum ada skill" body="Tambahkan skill dari halaman Admin." />
                  )}
                </Panel>
              </section>
            </>
          ) : null}

          <section id="reports" className="grid gap-4 lg:grid-cols-2">
            {featuredProfile ? <ReportCard profile={featuredProfile} /> : null}
            {secondProfile ? <ReportCard profile={secondProfile} compact /> : null}
          </section>
        </div>
      </div>
      <LogoutConfirmModal
        open={logoutOpen}
        role={data.current_user.role}
        loading={logoutLoading}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

function CenteredMessage({ title, body }: { title: string; body?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5 text-brand-text">
      <div className="animate-refresh-loader w-full max-w-md rounded-lg border border-brand-border bg-white p-5 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-brand-primary-dark text-xl font-semibold text-white animate-refresh-pulse">
          G
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">GrowTrack</p>
        <p className="mt-2 text-lg font-semibold">{title}</p>
        {body ? <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p> : null}
        {!body ? (
          <div className="mt-5 grid gap-3 text-left">
            <div className="h-3 overflow-hidden rounded-sm bg-brand-surface-glow">
              <div className="h-full w-1/2 rounded-sm bg-brand-primary animate-refresh-bar" />
            </div>
            <div className="grid gap-2 rounded-lg bg-brand-surface p-3">
              <div className="h-3 w-3/4 rounded bg-brand-border animate-refresh-shimmer" />
              <div className="h-3 w-1/2 rounded bg-brand-border animate-refresh-shimmer [animation-delay:120ms]" />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-3">
      <p className="text-2xl font-semibold">{value}{suffix}</p>
      <p className="mt-1 text-xs text-brand-primary-dark">{label}</p>
    </div>
  );
}

function LearningOrderCard({ order }: { order: LearningOrder }) {
  const isPaid = order.status === "paid";
  const accessUrl = order.type === "webinar" ? order.meeting_url : order.material_url;

  return (
    <article className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
            {order.type === "webinar" ? "Webinar" : "Course"} - {order.invoice_number}
          </p>
          <h3 className="mt-2 text-lg font-semibold">{order.title}</h3>
          <p className="mt-1 text-sm text-brand-muted">{order.category}</p>
        </div>
        <span className={`rounded-md px-3 py-1 text-xs font-semibold ${isPaid ? "bg-brand-surface-strong text-brand-primary-dark" : "bg-status-warning-bg text-status-warning-text"}`}>
          {order.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-brand-muted sm:grid-cols-2">
        <p>Total: <span className="font-semibold text-brand-text">{formatRupiah(order.amount)}</span></p>
        <p>Durasi: <span className="font-semibold text-brand-text">{order.duration ?? "-"}</span></p>
      </div>
      {order.status === "pending" ? (
        <p className="mt-4 rounded-md border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm leading-6 text-status-warning-text">
          Transfer manual sudah dicatat. Tunggu admin mengubah status menjadi paid.
        </p>
      ) : null}
      {isPaid ? (
        accessUrl ? (
          <a
            href={accessUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep"
          >
            {order.type === "webinar" ? "Buka Link Webinar" : "Akses Materi"}
          </a>
        ) : (
          <p className="mt-4 rounded-md bg-brand-surface-strong px-3 py-2 text-sm text-brand-muted">
            Akses aktif. Link materi belum diisi admin.
          </p>
        )
      ) : null}
    </article>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-border-strong bg-brand-panel-soft p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p>
    </div>
  );
}

function LearnerSummary({ profile, orders }: { profile: UserProfile; orders: LearningOrder[] }) {
  const paidOrders = orders.filter((order) => order.status === "paid").length;
  const activeRoadmap = profile.roadmap_progress.filter((progress) => progress.status !== "completed").length;
  const latestSubmission = profile.submissions[0];

  return (
    <Panel title="Ringkasan Belajar" eyebrow="Progress Kamu">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Akses aktif" value={paidOrders} />
        <Metric label="Task berjalan" value={activeRoadmap} />
      </div>
      <div className="mt-3 rounded-lg border border-brand-border p-4">
        <p className="text-sm font-semibold">Target belajar</p>
        <p className="mt-2 text-2xl font-semibold">{profile.target_position}</p>
        <p className="mt-1 text-sm leading-6 text-brand-muted">
          Goal utama: {profile.career_goal}
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-brand-border p-4">
        <p className="text-sm font-semibold">Evidence terbaru</p>
        <p className="mt-2 text-lg font-semibold">{latestSubmission?.title ?? "Belum ada evidence"}</p>
        <p className="mt-1 text-sm text-brand-muted">
          {latestSubmission ? `Status ${latestSubmission.status}` : "Kirim project evidence dari bagian Journey."}
        </p>
      </div>
    </Panel>
  );
}

function LiveSummary({ data }: { data: DashboardData }) {
  const newestProfile = data.profiles[0];
  const highestGap = data.hr_summary.highest_gap;

  return (
    <Panel title="Ringkasan Data Live" eyebrow="Database">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Assessments" value={data.assessments.length} />
        <Metric label="Roadmap" value={data.roadmap.length} />
      </div>
      <div className="mt-3 rounded-lg border border-brand-border p-4">
        <p className="text-sm font-semibold">Profil yang tampil</p>
        <p className="mt-2 text-2xl font-semibold">{data.profiles.length}</p>
        <p className="mt-1 text-sm leading-6 text-brand-muted">
          {newestProfile
            ? `${newestProfile.name} sedang mengikuti goal ${newestProfile.career_goal}.`
            : "Belum ada profil aktif yang bisa dipantau."}
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-brand-border p-4">
        <p className="text-sm font-semibold">Gap tertinggi</p>
        <p className="mt-2 text-2xl font-semibold">{highestGap?.skill ?? "Belum ada gap"}</p>
        <p className="mt-1 text-sm text-brand-muted">Gap {highestGap?.gap ?? 0}</p>
      </div>
    </Panel>
  );
}

function ProfileCard({
  profile,
  canManageJourney,
  journeyMessage,
  journeyError,
  onUpdateProgress,
  onSubmitEvidence,
}: {
  profile: UserProfile;
  canManageJourney: boolean;
  journeyMessage: string;
  journeyError: string;
  onUpdateProgress: (progress: RoadmapProgress, nextPercent: number) => void;
  onSubmitEvidence: (progressId: number, payload: { title: string; description: string }) => void;
}) {
  return (
    <Panel title="Active Career Journey" eyebrow={audienceLabel[profile.role]}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-2xl font-semibold">{profile.name}</h3>
            <p className="mt-1 text-sm text-brand-muted">{profile.email}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <p><span className="font-semibold">Current:</span> {profile.current_position}</p>
              <p><span className="font-semibold">Target:</span> {profile.target_position}</p>
              <p><span className="font-semibold">Goal:</span> {profile.career_goal}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-brand-muted">{profile.assessment.summary ?? "Assessment belum diisi."}</p>
            {!profile.assessment.summary ? (
              <Link
                href="/assessment"
                className="mt-4 inline-flex rounded-md bg-brand-primary-dark px-3 py-2 text-sm font-semibold text-white hover:bg-brand-primary-deep"
              >
                Kerjakan assessment
              </Link>
            ) : null}
          </div>
          <div className="rounded-lg bg-brand-primary-dark p-4 text-white md:w-44">
            <p className="text-sm text-brand-border">Readiness</p>
            <p className="mt-1 text-5xl font-semibold">{profile.readiness_score}%</p>
            <p className="mt-3 text-sm font-medium">{profile.readiness_status}</p>
          </div>
        </div>

        {journeyMessage ? (
          <p className="rounded-md border border-brand-border-strong bg-brand-surface-strong px-3 py-2 text-sm text-brand-primary-dark">
            {journeyMessage}
          </p>
        ) : null}
        {journeyError ? (
          <p className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
            {journeyError}
          </p>
        ) : null}

        <RoadmapJourney
          progress={profile.roadmap_progress}
          submissions={profile.submissions}
          canManageJourney={canManageJourney}
          onUpdateProgress={onUpdateProgress}
          onSubmitEvidence={onSubmitEvidence}
        />
      </div>
    </Panel>
  );
}

function RoadmapJourney({
  progress,
  submissions,
  canManageJourney,
  onUpdateProgress,
  onSubmitEvidence,
}: {
  progress: RoadmapProgress[];
  submissions: ProjectSubmission[];
  canManageJourney: boolean;
  onUpdateProgress: (progress: RoadmapProgress, nextPercent: number) => void;
  onSubmitEvidence: (progressId: number, payload: { title: string; description: string }) => void;
}) {
  if (!progress.length) {
    return (
      <div className="rounded-lg border border-dashed border-brand-border-strong bg-brand-panel-soft p-4">
        <p className="font-semibold">Roadmap belum tersedia</p>
        <p className="mt-2 text-sm leading-6 text-brand-muted">Admin perlu menambahkan module roadmap untuk career goal ini.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Roadmap Progress</p>
        <h3 className="mt-1 text-lg font-semibold">Update perjalanan belajar</h3>
      </div>
      {progress.map((item) => (
        <RoadmapProgressCard
          key={item.id}
          progress={item}
          submissions={submissions.filter((submission) => submission.roadmap_module_id === item.roadmap_module_id)}
          canManageJourney={canManageJourney}
          onUpdateProgress={onUpdateProgress}
          onSubmitEvidence={onSubmitEvidence}
        />
      ))}
    </section>
  );
}

function RoadmapProgressCard({
  progress,
  submissions,
  canManageJourney,
  onUpdateProgress,
  onSubmitEvidence,
}: {
  progress: RoadmapProgress;
  submissions: ProjectSubmission[];
  canManageJourney: boolean;
  onUpdateProgress: (progress: RoadmapProgress, nextPercent: number) => void;
  onSubmitEvidence: (progressId: number, payload: { title: string; description: string }) => void;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  function handleEvidenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmitEvidence(progress.id, {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
    });

    event.currentTarget.reset();
    setEvidenceOpen(false);
  }

  return (
    <article className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
            {progress.module_type} - {progress.duration_hours} jam
          </p>
          <h4 className="mt-2 font-semibold">{progress.title}</h4>
          <p className="mt-1 text-sm text-brand-muted">Status: {statusLabel(progress.status)}</p>
        </div>
        <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-primary-dark">
          {progress.progress_percent}%
        </span>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-sm bg-white">
        <div
          className="h-full rounded-sm bg-brand-primary-dark transition-all"
          style={{ width: `${progress.progress_percent}%` }}
        />
      </div>

      {canManageJourney ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdateProgress(progress, 25)} className="h-9 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white">
            25%
          </button>
          <button type="button" onClick={() => onUpdateProgress(progress, 50)} className="h-9 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white">
            50%
          </button>
          <button type="button" onClick={() => onUpdateProgress(progress, 100)} className="h-9 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep">
            Selesai
          </button>
          <button type="button" onClick={() => setEvidenceOpen((value) => !value)} className="h-9 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white">
            Submit Evidence
          </button>
        </div>
      ) : null}

      {evidenceOpen ? (
        <form className="mt-4 grid gap-3 rounded-lg border border-brand-border bg-white p-4" onSubmit={handleEvidenceSubmit}>
          <input
            name="title"
            placeholder="Judul evidence/project"
            required
            className="h-10 rounded-md border border-brand-border-strong px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
          />
          <textarea
            name="description"
            placeholder="Ceritakan output, link portfolio, atau bukti pengerjaan"
            required
            className="min-h-24 rounded-md border border-brand-border-strong px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
          />
          <button type="submit" className="h-10 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep">
            Kirim Evidence
          </button>
        </form>
      ) : null}

      {submissions.length ? (
        <div className="mt-4 grid gap-2">
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-md bg-white px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{submission.title}</p>
                <span className="rounded-md bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                  {submission.score === null ? submission.status : `${submission.score}%`}
                </span>
              </div>
              <p className="mt-1 leading-5 text-brand-muted">{submission.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function statusLabel(status: RoadmapProgress["status"]) {
  if (status === "completed") {
    return "Selesai";
  }

  if (status === "in_progress") {
    return "Sedang berjalan";
  }

  return "Belum mulai";
}

function HrSummary({ data }: { data: DashboardData }) {
  const gap = data.hr_summary.highest_gap;

  return (
    <Panel title="HR Snapshot" eyebrow="Talent overview">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Ready or almost" value={data.hr_summary.ready_or_almost_ready} />
          <Metric label="Profiles" value={data.hr_summary.total_active_profiles} />
        </div>
        <div className="rounded-lg border border-brand-border p-4">
          <p className="text-sm font-semibold">Highest organization gap</p>
          <p className="mt-2 text-2xl font-semibold">{gap?.skill ?? "No gap yet"}</p>
          <p className="mt-1 text-sm text-brand-muted">Gap {gap?.gap ?? 0}</p>
        </div>
      </div>
    </Panel>
  );
}

function ReportCard({ profile, compact = false }: { profile: UserProfile; compact?: boolean }) {
  return (
    <Panel title={compact ? "Secondary Report" : "Readiness Report"} eyebrow={profile.name}>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Assessment" value={profile.assessment.overall_score} suffix="%" />
          <Metric label="Roadmap" value={profile.roadmap_progress_score} suffix="%" />
          <Metric label="Evidence" value={profile.project_evidence_score} suffix="%" />
          <Metric label="Mentor" value={profile.mentor_feedback_score} suffix="%" />
        </div>
        <div className="rounded-lg border border-brand-border p-4">
          <p className="text-sm text-brand-primary-dark">Final readiness</p>
          <h3 className="text-3xl font-semibold">{profile.readiness_score}%</h3>
          <p className="mt-3 text-sm font-semibold">{profile.readiness_status}</p>
          <p className="mt-3 text-sm leading-6 text-brand-muted">{profile.mentor_feedback.notes ?? "Belum ada feedback mentor."}</p>
        </div>
      </div>
    </Panel>
  );
}
