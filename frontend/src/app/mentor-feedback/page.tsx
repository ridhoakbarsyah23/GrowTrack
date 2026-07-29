"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MentorFeedbackWorkspace } from "../components/MentorFeedbackWorkspace";

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

export default function MentorFeedbackPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadData() {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/mentor-feedback`, {
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
        setError("Feedback mentor gagal dimuat.");
        return;
      }

      const payload = await response.json();
      setProfiles(payload.profiles ?? []);
      setFeedback(payload.feedback ?? []);
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <CenteredMessage title="Memuat mentor feedback..." />;
  }

  return (
    <main className="min-h-screen bg-brand-surface px-5 py-6 text-brand-text">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-lg border border-brand-border bg-brand-surface-strong p-5">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-primary-dark hover:underline">
            Kembali ke dashboard
          </Link>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Mentor Feedback</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Isi rekomendasi mentor.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">
            Feedback ini masuk ke komponen readiness dan membantu user tahu langkah berikutnya.
          </p>
        </header>
        {error ? <p className="mt-5 rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm text-status-error-text">{error}</p> : null}
        <div className="mt-6">
          <MentorFeedbackWorkspace profiles={profiles} feedback={feedback} onChanged={loadData} />
        </div>
      </div>
    </main>
  );
}

function CenteredMessage({ title }: { title: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5 text-brand-text">
      <div className="rounded-lg border border-brand-border bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">GrowTrack</p>
        <p className="mt-2 text-lg font-semibold">{title}</p>
      </div>
    </main>
  );
}
