"use client";

import { useState } from "react";
import {
  AdminShell,
  AssessmentForm,
  CareerGoalForm,
  FormCard,
  LoadingAdmin,
  RoadmapForm,
  SectionHeader,
  SkillForm,
  type AdminData,
  useAdminData,
} from "../AdminShared";

export default function MasterDataPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [editingGoal, setEditingGoal] = useState<AdminData["career_goals"][number] | null>(null);
  const [editingSkill, setEditingSkill] = useState<AdminData["skills"][number] | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AdminData["assessment_templates"][number] | null>(null);
  const [editingModule, setEditingModule] = useState<AdminData["roadmap_modules"][number] | null>(null);
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

  async function saveGoal(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingGoal ? "PATCH" : "POST",
      editingGoal ? `/admin/career-goals/${editingGoal.id}` : "/admin/career-goals",
      payload,
    );

    if (ok) setEditingGoal(null);
  }

  async function saveSkill(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingSkill ? "PATCH" : "POST",
      editingSkill ? `/admin/skills/${editingSkill.id}` : "/admin/skills",
      payload,
    );

    if (ok) setEditingSkill(null);
  }

  async function saveTemplate(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingTemplate ? "PATCH" : "POST",
      editingTemplate ? `/admin/assessment-templates/${editingTemplate.id}` : "/admin/assessment-templates",
      payload,
    );

    if (ok) setEditingTemplate(null);
  }

  async function saveModule(payload: Record<string, unknown>) {
    const ok = await requestAdmin(
      editingModule ? "PATCH" : "POST",
      editingModule ? `/admin/roadmap-modules/${editingModule.id}` : "/admin/roadmap-modules",
      payload,
    );

    if (ok) setEditingModule(null);
  }

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Master data untuk career development."
      eyebrow="Master Data"
      body="Kelola data dasar yang dipakai oleh register, dashboard, assessment, dan roadmap."
      data={data}
      message={message || localMessage}
      error={error || localError}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Master Data"
        title="Fondasi sistem"
        body="Isi data dari atas ke bawah agar konfigurasi berikutnya punya sumber data yang lengkap."
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <FormCard title={editingGoal ? `Edit ${editingGoal.title}` : "Career Goal"} description="Buat jalur seperti promosi, specialist track, atau job readiness.">
          <CancelEditButton show={Boolean(editingGoal)} onClick={() => setEditingGoal(null)} />
          <CareerGoalForm key={editingGoal?.id ?? "new-goal"} goal={editingGoal} onSubmit={saveGoal} />
        </FormCard>

        <FormCard title={editingSkill ? `Edit ${editingSkill.name}` : "Skill"} description="Masukkan skill yang akan dinilai dalam assessment.">
          <CancelEditButton show={Boolean(editingSkill)} onClick={() => setEditingSkill(null)} />
          <SkillForm key={editingSkill?.id ?? "new-skill"} skill={editingSkill} onSubmit={saveSkill} />
        </FormCard>

        <FormCard title={editingTemplate ? `Edit ${editingTemplate.title}` : "Assessment Template"} description="Tentukan template assessment untuk employee atau fresh graduate.">
          <CancelEditButton show={Boolean(editingTemplate)} onClick={() => setEditingTemplate(null)} />
          <AssessmentForm key={editingTemplate?.id ?? "new-template"} template={editingTemplate} onSubmit={saveTemplate} />
        </FormCard>

        <FormCard title={editingModule ? `Edit ${editingModule.title}` : "Roadmap Module"} description="Tambahkan modul belajar atau project untuk setiap career goal.">
          <CancelEditButton show={Boolean(editingModule)} onClick={() => setEditingModule(null)} />
          <RoadmapForm
            key={editingModule?.id ?? "new-module"}
            goals={data.career_goals}
            module={editingModule}
            onSubmit={saveModule}
          />
        </FormCard>
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <EditableList
          title="Career Goals"
          items={data.career_goals.map((goal) => ({
            id: goal.id,
            title: goal.title,
            meta: `${goal.level} - ${goal.audience}`,
            body: goal.summary,
            onEdit: () => setEditingGoal(goal),
            onDelete: () => requestAdmin("DELETE", `/admin/career-goals/${goal.id}`),
          }))}
          empty="Belum ada career goal."
        />
        <EditableList
          title="Skills"
          items={data.skills.map((skill) => ({
            id: skill.id,
            title: skill.name,
            meta: skill.category,
            body: skill.description,
            onEdit: () => setEditingSkill(skill),
            onDelete: () => requestAdmin("DELETE", `/admin/skills/${skill.id}`),
          }))}
          empty="Belum ada skill."
        />
        <EditableList
          title="Assessment Templates"
          items={data.assessment_templates.map((template) => ({
            id: template.id,
            title: template.title,
            meta: `${template.audience} - ${template.question_count} pertanyaan`,
            body: template.description,
            onEdit: () => setEditingTemplate(template),
            onDelete: () => requestAdmin("DELETE", `/admin/assessment-templates/${template.id}`),
          }))}
          empty="Belum ada assessment template."
        />
        <EditableList
          title="Roadmap Modules"
          items={data.roadmap_modules.map((module) => ({
            id: module.id,
            title: `${module.sequence}. ${module.title}`,
            meta: `${module.career_goal} - ${module.module_type} - ${module.duration_hours} jam`,
            body: module.outcome,
            onEdit: () => setEditingModule(module),
            onDelete: () => requestAdmin("DELETE", `/admin/roadmap-modules/${module.id}`),
          }))}
          empty="Belum ada roadmap module."
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand-primary-dark">{item.meta}</p>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{item.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
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
