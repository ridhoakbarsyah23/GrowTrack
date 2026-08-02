"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Submission = {
  id: number;
  title: string;
  description: string;
  status: "submitted" | "reviewed" | "revision_needed";
  score: number | null;
  review_notes: string | null;
  learner_name: string;
  learner_email: string;
  career_goal: string;
  module_title: string;
  reviewer_name: string | null;
};

export default function EvidenceReviewStandalonePage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadSubmissions() {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/project-submissions/review-queue`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        setError("Evidence review gagal dimuat.");
        return;
      }

      const payload = await response.json();
      setSubmissions(payload.submissions ?? []);
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  async function reviewSubmission(submission: Submission, payload: Record<string, unknown>) {
    const token = localStorage.getItem("growtrack_token");
    setMessage("");
    setError("");

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
        setError(result.message ?? "Evidence gagal direview.");
        return;
      }

      setMessage(result.message ?? "Evidence berhasil direview.");
      await loadSubmissions();
    } catch {
      setError("Backend belum bisa dihubungi.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <CenteredMessage title="Memuat evidence review..." />;
  }

  const pendingCount = submissions.filter((item) => item.status === "submitted").length;

  return (
    <main className="min-h-screen bg-brand-surface px-5 py-6 text-brand-text">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-lg border border-brand-border bg-brand-surface-strong p-5">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-primary-dark hover:underline">
            Kembali ke dashboard
          </Link>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Mentor Review</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Review project evidence.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">
            Nilai evidence user agar skor project evidence ikut masuk ke readiness score.
          </p>
          <p className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-primary-dark">
            {pendingCount} evidence menunggu review
          </p>
        </header>

        {message ? <p className="mt-5 rounded-md border border-brand-border-strong bg-brand-surface-strong px-4 py-3 text-sm text-brand-primary-dark">{message}</p> : null}
        {error ? <p className="mt-5 rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm text-status-error-text">{error}</p> : null}

        <section className="mt-6 grid gap-4">
          {submissions.length ? (
            submissions.map((submission) => (
              <EvidenceReviewCard key={submission.id} submission={submission} onReview={reviewSubmission} />
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-brand-border-strong bg-white p-5 text-sm text-brand-muted">
              Belum ada evidence yang perlu direview.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function EvidenceReviewCard({
  submission,
  onReview,
}: {
  submission: Submission;
  onReview: (submission: Submission, payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const score = form.get("score");

    onReview(submission, {
      status: form.get("status"),
      score: score === "" ? null : Number(score),
      review_notes: form.get("review_notes"),
    });
  }

  return (
    <article className="rounded-lg border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
            {submission.learner_name} - {submission.career_goal}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{submission.title}</h2>
          <p className="mt-1 text-sm font-semibold text-brand-muted">{submission.module_title}</p>
          <p className="mt-3 text-sm leading-6 text-brand-muted">{submission.description}</p>
        </div>
        <span className="rounded-md bg-brand-surface-strong px-3 py-2 text-sm font-semibold text-brand-primary-dark">
          {submission.status}
        </span>
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-[160px_140px_1fr_auto]" onSubmit={handleSubmit}>
        <select name="status" defaultValue="reviewed" className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus">
          <option value="reviewed">Reviewed</option>
          <option value="revision_needed">Revision Needed</option>
          <option value="submitted">Submitted</option>
        </select>
        <input name="score" type="number" min="0" max="100" defaultValue={submission.score ?? ""} placeholder="Score" className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus" />
        <input name="review_notes" defaultValue={submission.review_notes ?? ""} placeholder="Catatan review" className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus" />
        <button className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep">
          Simpan Review
        </button>
      </form>
    </article>
  );
}

function CenteredMessage({ title }: { title: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5 text-brand-text">
      <div className="rounded-lg border border-brand-border bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Pathly AI</p>
        <p className="mt-2 text-lg font-semibold">{title}</p>
      </div>
    </main>
  );
}
