"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MockInterview = {
  id: number;
  user_id: number;
  target_role: string;
  status: "ongoing" | "completed";
  score: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

export default function MockInterviewList() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInterviews() {
      const token = localStorage.getItem("growtrack_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
      
      try {
        const response = await fetch(`${baseUrl}/mock-interviews`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
        } else {
          setError("Gagal memuat riwayat interview.");
        }
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    fetchInterviews();
  }, [router]);

  async function startNewInterview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = localStorage.getItem("growtrack_token");
    if (!token) return;

    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const targetRole = form.get("target_role") as string;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/mock-interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_role: targetRole }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/mock-interview/${data.interview.id}`);
      } else {
        alert("Gagal memulai sesi baru.");
      }
    } catch {
      alert("Error menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-brand-muted">Memuat...</div>;
  }

  return (
    <main className="min-h-screen bg-brand-surface p-5 text-brand-text">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-brand-primary-dark hover:underline">
              &larr; Kembali ke Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold">AI Mock Interview</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Latih kemampuan wawancara kerjamu dengan simulasi berbasis AI.
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Mulai Simulasi Baru</h2>
          <form onSubmit={startNewInterview} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              name="target_role"
              required
              placeholder="Contoh: Frontend Developer, Product Manager..."
              className="flex-1 rounded-md border border-brand-border-strong px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {submitting ? "Memulai..." : "Mulai Simulasi"}
            </button>
          </form>
        </section>

        {error && (
          <div className="mb-6 rounded-md bg-status-error-bg p-4 text-sm text-status-error-text">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Riwayat Interview</h2>
          
          {interviews.length === 0 ? (
            <p className="text-sm text-brand-muted">Belum ada riwayat simulasi interview.</p>
          ) : (
            <div className="grid gap-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex flex-col justify-between gap-4 rounded-lg border border-brand-border p-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-brand-text">{interview.target_role}</h3>
                    <p className="text-xs text-brand-muted">
                      {new Date(interview.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {interview.status === "completed" ? (
                      <span className="rounded bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                        Skor: {interview.score}/100
                      </span>
                    ) : (
                      <span className="rounded bg-status-warning-bg px-2 py-1 text-xs font-semibold text-status-warning-text">
                        Ongoing
                      </span>
                    )}
                    <Link
                      href={`/dashboard/mock-interview/${interview.id}`}
                      className="rounded-md border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-primary-dark transition hover:bg-brand-surface-strong"
                    >
                      {interview.status === "completed" ? "Lihat Hasil" : "Lanjutkan"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
