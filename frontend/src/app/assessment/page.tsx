"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
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
    role: "student" | "fresh_graduate" | "employee";
    education: string | null;
    career_goal: string;
    current_position: string;
    experience_summary: string | null;
    self_reported_skills: string | null;
    interests: string | null;
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

type CareerProfile = {
  headline: string;
  summary: string;
  readiness_level: string;
  target: {
    career_goal: string;
    target_position: string;
    current_position: string;
  };
  background: {
    education: string | null;
    experience_summary: string | null;
    self_reported_skills: string | null;
    interests: string | null;
  };
  strengths: Array<{ skill: string; score: number }>;
  development_priorities: Array<{ skill: string; score: number; target_score: number; gap: number; priority: string }>;
  skill_gap_summary: SkillGapAnalysis["summary"];
  next_steps: string[];
};

type SkillGapItem = {
  skill: string;
  category: string;
  description: string;
  current_score: number;
  target_score: number;
  gap: number;
  status: "target_met" | "near_target" | "needs_practice" | "critical_gap";
  severity: string;
  recommendation: string;
  target_source: "configured" | "assessment_default";
};

type SkillGapAnalysis = {
  items: SkillGapItem[];
  summary: {
    total_skills: number;
    met_target: number;
    priority_count: number;
    average_gap: number;
    highest_gap: SkillGapItem | null;
    target_source: "configured" | "assessment_default";
    default_target_score: number | null;
  };
};

export default function AssessmentPage() {
  const router = useRouter();
  const [data, setData] = useState<AssessmentPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);

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
    setCareerProfile(null);
    setSkillGapAnalysis(null);
    setOverallScore(null);

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

      setMessage(payload.message ?? "Assessment berhasil disimpan.");
      setCareerProfile(payload.career_profile ?? null);
      setSkillGapAnalysis(payload.skill_gap_analysis ?? null);
      setOverallScore(payload.overall_score ?? null);
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
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Info label="Pendidikan" value={data.profile.education ?? "-"} />
            <Info label="Skill awal" value={data.profile.self_reported_skills ?? "-"} />
            <Info label="Minat" value={data.profile.interests ?? "-"} />
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

          {careerProfile ? (
            <CareerProfileResult profile={careerProfile} skillGapAnalysis={skillGapAnalysis} overallScore={overallScore} />
          ) : null}

          <button
            type="submit"
            disabled={saving || !data.questions.length}
            className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Menyimpan..." : careerProfile ? "Submit ulang assessment" : "Submit assessment"}
          </button>
          {careerProfile ? (
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-md border border-brand-border-strong px-4 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
            >
              Lanjut ke dashboard
            </Link>
          ) : null}
        </form>
      </div>
    </main>
  );
}

function CareerProfileResult({
  profile,
  skillGapAnalysis,
  overallScore,
}: {
  profile: CareerProfile;
  skillGapAnalysis: SkillGapAnalysis | null;
  overallScore: number | null;
}) {
  return (
    <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Career Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{profile.headline}</h2>
          <p className="mt-3 text-sm leading-6 text-brand-muted">{profile.summary}</p>
        </div>
        <div className="rounded-lg bg-brand-primary-dark p-4 text-white">
          <p className="text-sm text-brand-border">Readiness</p>
          <p className="mt-1 text-4xl font-semibold">{overallScore ?? 0}%</p>
          <p className="mt-2 text-sm font-medium">{profile.readiness_level}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <ResultPanel title="Kekuatan utama">
          {profile.strengths.map((item) => (
            <ResultItem key={item.skill} title={item.skill} meta={`${item.score}%`} />
          ))}
        </ResultPanel>
        <ResultPanel title="Prioritas pengembangan">
          {profile.development_priorities.map((item) => (
            <ResultItem key={item.skill} title={item.skill} meta={`${item.score}% -> ${item.target_score}% | Gap ${item.gap} - ${item.priority}`} />
          ))}
        </ResultPanel>
        <ResultPanel title="Langkah berikutnya">
          {profile.next_steps.map((step) => (
            <ResultItem key={step} title={step} />
          ))}
        </ResultPanel>
      </div>
      {skillGapAnalysis ? <SkillGapResult analysis={skillGapAnalysis} /> : null}
    </section>
  );
}

function SkillGapResult({ analysis }: { analysis: SkillGapAnalysis }) {
  return (
    <section className="mt-5 rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Skill Gap Analysis</h3>
          <p className="mt-1 text-sm leading-6 text-brand-muted">
            {analysis.summary.met_target}/{analysis.summary.total_skills} skill sudah memenuhi target. Rata-rata gap {analysis.summary.average_gap}.
          </p>
          {analysis.summary.target_source === "assessment_default" ? (
            <p className="mt-2 rounded-md border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm leading-6 text-status-warning-text">
              Target skill resmi belum dikonfigurasi admin. Analisis ini memakai target sementara {analysis.summary.default_target_score}% dari skill assessment.
            </p>
          ) : null}
        </div>
        <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-brand-primary-dark">
          {analysis.summary.priority_count} prioritas
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {analysis.items.map((item) => (
          <article key={item.skill} className="rounded-md border border-brand-border bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{item.skill}</p>
                <p className="mt-1 text-xs font-semibold text-brand-primary-dark">{item.category} - {item.severity}</p>
              </div>
              <span className="rounded-md bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                Gap {item.gap}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-sm bg-brand-surface">
              <div className="h-full rounded-sm bg-brand-primary-dark" style={{ width: `${Math.min(item.current_score, 100)}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-semibold text-brand-muted">
              <span>Saat ini {item.current_score}%</span>
              <span>Target {item.target_score}%</span>
            </div>
            {item.target_source === "assessment_default" ? (
              <p className="mt-2 text-xs font-semibold text-status-warning-text">Target sementara dari assessment</p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-brand-muted">{item.recommendation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResultPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

function ResultItem({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 text-sm">
      <p className="font-semibold">{title}</p>
      {meta ? <p className="mt-1 text-xs text-brand-muted">{meta}</p> : null}
    </div>
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
        <p className="text-sm font-semibold text-brand-primary-dark">Pathly AI</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        {body ? <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p> : null}
        <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-brand-primary-dark hover:underline">
          Kembali ke dashboard
        </Link>
      </section>
    </main>
  );
}
