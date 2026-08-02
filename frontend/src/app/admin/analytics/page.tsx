"use client";

import { useEffect, useState } from "react";
import {
  AdminShell,
  LoadingAdmin,
  SectionHeader,
  useAdminData,
} from "../AdminShared";

type Analytics = {
  users: { total: number; learners: number; admins: number; mentors: number };
  profiles: { total: number; by_role: Record<string, number> };
  assessment: { results: number; templates: number; questions: number };
  roadmap: { modules: number; progress_items: number; completed_items: number };
  products: { draft: number; active: number; inactive: number };
  orders: Record<"pending" | "paid" | "cancelled", { count: number; revenue: number }>;
  evidence: Record<"submitted" | "reviewed" | "revision_needed", { count: number; average_score: number }>;
  top_skill_targets: Array<{ name: string; category: string; career_goal_count: number; average_target: number }>;
  updated_at: string;
};

export default function AdminAnalyticsPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadAnalytics() {
    const token = localStorage.getItem("growtrack_token");

    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const response = await fetch(`${baseUrl}/admin/analytics`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        setAnalyticsError(payload.message ?? "Analytics gagal dimuat.");
        return;
      }

      setAnalytics(payload);
    } catch {
      setAnalyticsError("Backend belum bisa dihubungi.");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Pantau kesehatan operasional Pathly AI."
      eyebrow="Analytics"
      body="Lihat apakah setup, user journey, produk, order, dan evidence sudah mulai bergerak."
      data={data}
      message={message}
      error={error || analyticsError}
      onRefresh={() => {
        loadData();
        loadAnalytics();
      }}
    >
      {analyticsLoading ? (
        <p className="rounded-lg border border-brand-border bg-white p-5 text-sm text-brand-muted">Memuat analytics...</p>
      ) : analytics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AnalyticsCard label="Learners" value={analytics.users.learners} body={`${analytics.users.total} total user`} />
            <AnalyticsCard label="Assessment Results" value={analytics.assessment.results} body={`${analytics.assessment.questions} question aktif`} />
            <AnalyticsCard label="Paid Orders" value={analytics.orders.paid.count} body={formatRupiah(analytics.orders.paid.revenue)} />
            <AnalyticsCard label="Evidence Reviewed" value={analytics.evidence.reviewed.count} body={`${analytics.evidence.reviewed.average_score}% average score`} />
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel title="Produk" eyebrow="Commerce">
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallMetric label="Draft" value={analytics.products.draft} />
                <SmallMetric label="Active" value={analytics.products.active} />
                <SmallMetric label="Inactive" value={analytics.products.inactive} />
              </div>
            </Panel>

            <Panel title="Order" eyebrow="Revenue">
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallMetric label="Pending" value={analytics.orders.pending.count} helper={formatRupiah(analytics.orders.pending.revenue)} />
                <SmallMetric label="Paid" value={analytics.orders.paid.count} helper={formatRupiah(analytics.orders.paid.revenue)} />
                <SmallMetric label="Cancelled" value={analytics.orders.cancelled.count} helper={formatRupiah(analytics.orders.cancelled.revenue)} />
              </div>
            </Panel>

            <Panel title="Roadmap" eyebrow="Journey">
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallMetric label="Modules" value={analytics.roadmap.modules} />
                <SmallMetric label="Progress" value={analytics.roadmap.progress_items} />
                <SmallMetric label="Completed" value={analytics.roadmap.completed_items} />
              </div>
            </Panel>

            <Panel title="Evidence" eyebrow="Review">
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallMetric label="Submitted" value={analytics.evidence.submitted.count} />
                <SmallMetric label="Reviewed" value={analytics.evidence.reviewed.count} />
                <SmallMetric label="Revision" value={analytics.evidence.revision_needed.count} />
              </div>
            </Panel>
          </section>

          <section className="mt-5 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <SectionHeader
              eyebrow="Skill Targets"
              title="Skill yang paling sering dipakai career goal"
              body="Gunakan ini untuk melihat skill inti yang menjadi fondasi roadmap dan assessment."
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {analytics.top_skill_targets.length ? (
                analytics.top_skill_targets.map((skill) => (
                  <article key={skill.name} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">{skill.category}</p>
                    <h2 className="mt-2 font-semibold">{skill.name}</h2>
                    <p className="mt-2 text-sm text-brand-muted">{skill.career_goal_count} career goal - target rata-rata {skill.average_target}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">Belum ada target skill.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

function AnalyticsCard({ label, value, body }: { label: string; value: number; body: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-brand-primary-dark">{label}</p>
      <p className="mt-2 text-4xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-5 text-brand-muted">{body}</p>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SmallMetric({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <p className="text-sm font-semibold text-brand-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-primary-dark">{value}</p>
      {helper ? <p className="mt-1 text-xs font-semibold text-brand-muted-light">{helper}</p> : null}
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
