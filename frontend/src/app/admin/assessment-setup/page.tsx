"use client";

import { useState } from "react";
import {
  AdminShell,
  AssessmentQuestionForm,
  FormCard,
  LoadingAdmin,
  SectionHeader,
  SkillTargetForm,
  type AdminData,
  useAdminData,
} from "../AdminShared";

export default function AssessmentSetupPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [editingTarget, setEditingTarget] = useState<AdminData["skill_targets"][number] | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<AdminData["assessment_questions"][number] | null>(null);
  const [localMessage, setLocalMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function requestAdmin(method: "POST" | "PATCH" | "DELETE", endpoint: string, payload?: Record<string, unknown>) {
    const token = localStorage.getItem("growtrack_token");
    setLocalMessage("");
    setLocalError("");

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const result = await response.json();

      if (!response.ok) {
        setLocalError(result.message ?? "Data gagal diproses.");
        return false;
      }

      setLocalMessage(result.message ?? "Data berhasil diproses.");
      await loadData();
      return true;
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
      return false;
    }
  }

  async function saveTarget(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingTarget ? "PATCH" : "POST",
      editingTarget ? `/admin/skill-targets/${editingTarget.id}` : "/admin/skill-targets",
      payload,
    );

    if (ok) setEditingTarget(null);
  }

  async function saveQuestion(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingQuestion ? "PATCH" : "POST",
      editingQuestion ? `/admin/assessment-questions/${editingQuestion.id}` : "/admin/assessment-questions",
      payload,
    );

    if (ok) setEditingQuestion(null);
  }

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Atur target skill dan pertanyaan assessment."
      eyebrow="Assessment Setup"
      body="Konfigurasi ini menentukan cara sistem menghitung skill gap user setelah assessment disubmit."
      data={data}
      message={message || localMessage}
      error={error || localError}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Assessment Setup"
        title="Target skill dan pertanyaan"
        body="Hubungkan career goal dengan skill target untuk hasil gap yang akurat. Jika belum ada target, sistem tetap memakai target sementara dari skill assessment."
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <FormCard title={editingTarget ? "Edit Target Skill" : "Target Skill per Career Goal"} description="Tentukan target score resmi untuk tiap career goal agar skill gap lebih presisi.">
          <CancelEditButton show={Boolean(editingTarget)} onClick={() => setEditingTarget(null)} />
          <SkillTargetForm
            key={editingTarget?.id ?? "new-target"}
            goals={data.career_goals}
            skills={data.skills}
            target={editingTarget}
            onSubmit={saveTarget}
          />
        </FormCard>

        <FormCard title={editingQuestion ? "Edit Assessment Question" : "Assessment Question"} description="Buat pertanyaan dan hubungkan ke skill agar scoring otomatis berjalan.">
          <CancelEditButton show={Boolean(editingQuestion)} onClick={() => setEditingQuestion(null)} />
          <AssessmentQuestionForm
            key={editingQuestion?.id ?? "new-question"}
            templates={data.assessment_templates}
            skills={data.skills}
            question={editingQuestion}
            onSubmit={saveQuestion}
          />
        </FormCard>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <EditableList
          title="Skill targets"
          items={data.skill_targets.map((target) => ({
            id: target.id,
            title: `${target.career_goal} - ${target.skill}`,
            meta: `Target score ${target.target_score}`,
            body: "Target resmi ini dipakai untuk menggantikan target sementara dari assessment.",
            onEdit: () => setEditingTarget(target),
            onDelete: () => requestAdmin("DELETE", `/admin/skill-targets/${target.id}`),
          }))}
          empty="Belum ada target skill. Skill gap tetap berjalan memakai target sementara setelah user submit assessment."
        />
        <EditableList
          title="Questions"
          items={data.assessment_questions.map((question) => ({
            id: question.id,
            title: `${question.assessment_template} - ${question.skill}`,
            meta: `Weight ${question.weight} - max ${question.max_score}`,
            body: question.question,
            onEdit: () => setEditingQuestion(question),
            onDelete: () => requestAdmin("DELETE", `/admin/assessment-questions/${question.id}`),
          }))}
          empty="Belum ada pertanyaan assessment."
        />
      </section>
    </AdminShell>
  );
}

function CancelEditButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
    >
      Batal edit
    </button>
  );
}

function EditableList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: number; title: string; meta: string; body: string; onEdit: () => void; onDelete: () => void }>;
  empty: string;
}) {
  return (
    <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand-primary-dark">{item.meta}</p>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{item.body}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                  <button type="button" onClick={item.onEdit} className="h-9 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep">
                    Edit
                  </button>
                  <button type="button" onClick={item.onDelete} className="h-9 rounded-md border border-status-error-border px-3 text-sm font-semibold text-status-error-text hover:bg-status-error-bg">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}
