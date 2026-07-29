"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type Profile = {
  id: number;
  name: string;
  email: string;
  role: "employee" | "fresh_graduate";
  current_position: string | null;
  target_position: string;
  career_goal: string;
};

type Feedback = {
  id: number;
  user_profile_id: number;
  mentor_id: number;
  recommendation: string;
  score: number;
  notes: string;
  updated_at: string;
  learner_name: string;
  learner_email: string;
  career_goal: string;
  mentor_name: string;
};

export function MentorFeedbackWorkspace({
  profiles,
  feedback,
  onChanged,
}: {
  profiles: Profile[];
  feedback: Feedback[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Feedback | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function saveFeedback(payload: Record<string, unknown>) {
    const token = localStorage.getItem("growtrack_token");
    const endpoint = editing ? `/mentor-feedback/${editing.id}` : "/mentor-feedback";

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Feedback mentor gagal disimpan.");
        return;
      }

      setMessage(result.message ?? "Feedback mentor berhasil disimpan.");
      setEditing(null);
      onChanged();
    } catch {
      setError("Backend belum bisa dihubungi.");
    }
  }

  async function deleteFeedback(item: Feedback) {
    const token = localStorage.getItem("growtrack_token");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${baseUrl}/mentor-feedback/${item.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Feedback mentor gagal dihapus.");
        return;
      }

      setMessage(result.message ?? "Feedback mentor berhasil dihapus.");
      if (editing?.id === item.id) {
        setEditing(null);
      }
      onChanged();
    } catch {
      setError("Backend belum bisa dihubungi.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
        <h2 className="text-xl font-semibold">{editing ? `Edit feedback ${editing.learner_name}` : "Feedback Baru"}</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Feedback mentor menjadi komponen readiness score dan tampil di dashboard user.
        </p>
        {message ? <p className="mt-4 rounded-md border border-brand-border-strong bg-brand-surface-strong px-3 py-2 text-sm text-brand-primary-dark">{message}</p> : null}
        {error ? <p className="mt-4 rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">{error}</p> : null}
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="mt-4 h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
          >
            Batal edit
          </button>
        ) : null}
        <MentorFeedbackForm
          key={editing?.id ?? "new-feedback"}
          profiles={profiles}
          feedback={editing}
          onSubmit={saveFeedback}
        />
      </section>

      <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Feedback List</p>
            <h2 className="mt-2 text-xl font-semibold">Feedback yang sudah tersimpan</h2>
          </div>
          <span className="rounded-md bg-brand-surface-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark">
            {feedback.length} feedback
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {feedback.length ? (
            feedback.map((item) => (
              <article key={item.id} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                      {item.learner_name} - {item.career_goal}
                    </p>
                    <h3 className="mt-2 font-semibold">{item.recommendation}</h3>
                    <p className="mt-1 text-sm text-brand-muted">Mentor: {item.mentor_name}</p>
                    <p className="mt-3 text-sm leading-6 text-brand-muted">{item.notes}</p>
                  </div>
                  <div className="grid min-w-32 gap-2">
                    <span className="rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-brand-primary-dark">
                      {item.score}%
                    </span>
                    <button type="button" onClick={() => setEditing(item)} className="h-9 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep">
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteFeedback(item)} className="h-9 rounded-md border border-status-error-border px-3 text-sm font-semibold text-status-error-text hover:bg-status-error-bg">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">
              Belum ada feedback mentor.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function MentorFeedbackForm({
  profiles,
  feedback,
  onSubmit,
}: {
  profiles: Profile[];
  feedback: Feedback | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit({
      user_profile_id: feedback ? feedback.user_profile_id : Number(form.get("user_profile_id")),
      recommendation: form.get("recommendation"),
      score: Number(form.get("score")),
      notes: form.get("notes"),
    });

    if (!feedback) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
      <select
        name="user_profile_id"
        defaultValue={feedback?.user_profile_id ?? ""}
        disabled={Boolean(feedback)}
        required
        className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus disabled:bg-brand-surface"
      >
        <option value="">Pilih user profile</option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name} - {profile.career_goal}
          </option>
        ))}
      </select>
      <input
        name="recommendation"
        placeholder="Rekomendasi, contoh: Siap lanjut tahap interview"
        defaultValue={feedback?.recommendation ?? ""}
        required
        className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
      />
      <input
        name="score"
        placeholder="Score 0-100"
        type="number"
        min="0"
        max="100"
        defaultValue={feedback?.score ?? ""}
        required
        className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
      />
      <textarea
        name="notes"
        placeholder="Catatan mentor"
        defaultValue={feedback?.notes ?? ""}
        required
        className="min-h-28 rounded-md border border-brand-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
      />
      <button className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep">
        Simpan Feedback
      </button>
    </form>
  );
}
