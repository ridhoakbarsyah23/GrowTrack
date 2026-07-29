"use client";

import type { FormEvent } from "react";
import {
  AdminShell,
  LoadingAdmin,
  SectionHeader,
  type AdminData,
  useAdminData,
} from "../AdminShared";
import { useState } from "react";

type Submission = AdminData["project_submissions"][number];

export default function EvidenceReviewPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [localMessage, setLocalMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function reviewSubmission(submission: Submission, payload: Record<string, unknown>) {
    const token = localStorage.getItem("growtrack_token");
    setLocalMessage("");
    setLocalError("");

    try {
      const response = await fetch(`${baseUrl}/project-submissions/${submission.id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setLocalError(result.message ?? "Evidence gagal direview.");
        return;
      }

      setLocalMessage(result.message ?? "Evidence berhasil direview.");
      await loadData();
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
    }
  }

  if (loading) {
    return <LoadingAdmin />;
  }

  const pendingCount = data.project_submissions.filter((item) => item.status === "submitted").length;

  return (
    <AdminShell
      title="Review project evidence user."
      eyebrow="Evidence Review"
      body="Beri score dan catatan untuk project submission. Score yang sudah reviewed akan masuk ke komponen project evidence readiness."
      data={data}
      message={message || localMessage}
      error={error || localError}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Project Evidence"
        title={`${pendingCount} evidence menunggu review`}
        body="Gunakan reviewed untuk memberi score final. Gunakan revision needed jika evidence perlu diperbaiki user."
      />

      <section className="mt-5 grid gap-4">
        {data.project_submissions.length ? (
          data.project_submissions.map((submission) => (
            <EvidenceCard key={submission.id} submission={submission} onReview={reviewSubmission} />
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-brand-border-strong bg-white p-5 text-sm text-brand-muted">
            Belum ada project evidence yang dikirim user.
          </p>
        )}
      </section>
    </AdminShell>
  );
}

function EvidenceCard({
  submission,
  onReview,
}: {
  submission: Submission;
  onReview: (submission: Submission, payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = String(form.get("status"));
    const score = form.get("score");

    onReview(submission, {
      status,
      score: score === "" ? null : Number(score),
      review_notes: form.get("review_notes"),
    });
  }

  return (
    <article className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
            {submission.learner_name} - {submission.career_goal}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{submission.title}</h2>
          <p className="mt-1 text-sm font-semibold text-brand-muted">{submission.module_title}</p>
          <p className="mt-3 text-sm leading-6 text-brand-muted">{submission.description}</p>
        </div>
        <span className={`rounded-md px-3 py-2 text-sm font-semibold ${statusClass(submission.status)}`}>
          {statusLabel(submission.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-brand-panel-soft p-4 text-sm sm:grid-cols-3">
        <Info label="Email" value={submission.learner_email} />
        <Info label="Score" value={submission.score === null ? "Belum dinilai" : `${submission.score}%`} />
        <Info label="Reviewer" value={submission.reviewer_name ?? "-"} />
      </div>

      {submission.review_notes ? (
        <p className="mt-4 rounded-md bg-brand-surface px-3 py-2 text-sm leading-6 text-brand-muted">
          {submission.review_notes}
        </p>
      ) : null}

      <form className="mt-4 grid gap-3 md:grid-cols-[160px_140px_1fr_auto]" onSubmit={handleSubmit}>
        <select
          name="status"
          defaultValue={submission.status === "reviewed" ? "reviewed" : "reviewed"}
          className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
        >
          <option value="reviewed">Reviewed</option>
          <option value="revision_needed">Revision Needed</option>
          <option value="submitted">Submitted</option>
        </select>
        <input
          name="score"
          type="number"
          min="0"
          max="100"
          defaultValue={submission.score ?? ""}
          placeholder="Score"
          className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
        />
        <input
          name="review_notes"
          defaultValue={submission.review_notes ?? ""}
          placeholder="Catatan review"
          className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
        />
        <button className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep">
          Simpan Review
        </button>
      </form>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function statusLabel(status: Submission["status"]) {
  if (status === "reviewed") {
    return "Reviewed";
  }

  if (status === "revision_needed") {
    return "Revision Needed";
  }

  return "Submitted";
}

function statusClass(status: Submission["status"]) {
  if (status === "reviewed") {
    return "bg-brand-surface-strong text-brand-primary-dark";
  }

  if (status === "revision_needed") {
    return "bg-status-warning-bg text-status-warning-text";
  }

  return "bg-white text-brand-primary-dark";
}
