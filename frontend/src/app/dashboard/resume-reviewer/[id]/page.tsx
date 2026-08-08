"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type ResumeReview = {
  id: number;
  user_id: number;
  target_role: string;
  resume_text: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
};

export default function ResumeReviewDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReview() {
      const token = localStorage.getItem("growtrack_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
      
      try {
        const response = await fetch(`${baseUrl}/resume-reviews/${params.id}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReview(data.review);
        } else {
          setError("Gagal memuat detail review.");
        }
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadReview();
  }, [params.id, router]);

  if (loading) {
    return <div className="p-8 text-center text-brand-muted">Memuat...</div>;
  }

  if (error || !review) {
    return <div className="p-8 text-center text-status-error-text">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-brand-surface p-5 text-brand-text">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/resume-reviewer" className="text-sm font-semibold text-brand-primary-dark hover:underline">
            &larr; Kembali ke Daftar Review
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Hasil Evaluasi Resume</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Target Posisi: <strong className="text-brand-text">{review.target_role}</strong>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <section className="rounded-lg border border-brand-border bg-white p-6 shadow-sm self-start sticky top-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-primary-dark">Skor Kesesuaian</h2>
            <div className="mt-4 flex flex-col items-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-brand-primary-dark bg-brand-surface-strong">
                <span className="text-4xl font-black text-brand-primary-dark">{review.score ?? 0}</span>
              </div>
              <p className="mt-4 text-center text-sm text-brand-muted">
                Skor 1-100 berdasarkan tingkat relevansi CV dengan {review.target_role}.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Umpan Balik AI</h2>
            <div className="mt-2 max-w-none text-sm leading-6 text-brand-muted">
              {(review.feedback ?? "Tidak ada feedback.").split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>

            <div className="mt-8 border-t border-brand-border pt-6">
              <h3 className="mb-3 text-sm font-semibold">Teks Resume yang Dianalisis:</h3>
              <div className="max-h-64 overflow-y-auto rounded-md bg-brand-surface-strong p-4 text-xs font-mono text-brand-muted">
                {review.resume_text}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
