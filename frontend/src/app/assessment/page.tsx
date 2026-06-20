"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Question = {
  id: number;
  question: string;
  weight: number;
  max_score: number;
  skill: string;
  skill_category: string;
};

type AssessmentPayload = {
  profile: {
    id: number;
    career_goal: string;
    current_position: string;
    target_position: string;
  };
  template: {
    id: number;
    title: string;
    description: string;
    question_count: number;
  };
  questions: Question[];
};

export default function AssessmentPage() {
  const router = useRouter();
  const [data, setData] = useState<AssessmentPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadAssessment() {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

      try {
        const response = await fetch(`${baseUrl}/assessment/current`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const payload = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("growtrack_token");
          localStorage.removeItem("growtrack_user");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setError(payload.message ?? "Assessment belum tersedia.");
          return;
        }

        setData(payload);
        setAnswers(
          Object.fromEntries(payload.questions.map((question: Question) => [question.id, question.max_score])),
        );
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadAssessment();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!data) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const token = localStorage.getItem("growtrack_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/assessment/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assessment_template_id: data.template.id,
          answers: data.questions.map((question) => ({
            question_id: question.id,
            score: answers[question.id],
          })),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Assessment gagal disimpan.");
        return;
      }

      setMessage(`${payload.message} Overall score: ${payload.overall_score}%`);
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <CenteredMessage title="Memuat assessment..." />;
  }

  if (error && !data) {
    return <CenteredMessage title="Assessment tidak tersedia" body={error} />;
  }

  if (!data) {
    return <CenteredMessage title="Assessment tidak tersedia" />;
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
              Assessment
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{data.template.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
              {data.template.description}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
          >
            Dashboard
          </Link>
        </header>

        <section className="mt-5 rounded-lg border border-brand-border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Info label="Career goal" value={data.profile.career_goal} />
            <Info label="Current" value={data.profile.current_position} />
            <Info label="Target" value={data.profile.target_position} />
          </div>
        </section>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          {data.questions.map((question, index) => (
            <article key={question.id} className="rounded-lg border border-brand-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                    {question.skill} - {question.skill_category}
                  </p>
                  <h2 className="mt-2 font-semibold">
                    {index + 1}. {question.question}
                  </h2>
                </div>
                <span className="rounded-md bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                  Weight {question.weight}
                </span>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Skor: {answers[question.id] ?? question.max_score} / {question.max_score}
                </label>
                <input
                  type="range"
                  min={1}
                  max={question.max_score}
                  value={answers[question.id] ?? question.max_score}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: Number(event.target.value),
                    }))
                  }
                  className="mt-3 w-full accent-brand-primary-dark"
                />
              </div>
            </article>
          ))}

          {error ? (
            <p className="rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-brand-border-strong bg-brand-surface-strong px-4 py-3 text-sm text-brand-primary-dark">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || !data.questions.length}
            className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Menyimpan..." : "Submit assessment"}
          </button>
        </form>
      </div>
    </main>
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

function CenteredMessage({ title, body }: { title: string; body?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5 text-brand-text">
      <section className="max-w-md rounded-lg border border-brand-border bg-white p-5 text-center">
        <p className="text-sm font-semibold text-brand-primary-dark">GrowTrack</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        {body ? <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p> : null}
        <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-brand-primary-dark hover:underline">
          Kembali ke dashboard
        </Link>
      </section>
    </main>
  );
}
