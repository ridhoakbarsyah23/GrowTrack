"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResumeReview = {
  id: number;
  user_id: number;
  target_role: string;
  score: number | null;
  created_at: string;
};

export default function ResumeReviewList() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ResumeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      const token = localStorage.getItem("growtrack_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
      
      try {
        const response = await fetch(`${baseUrl}/resume-reviews`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews);
        } else {
          setError("Gagal memuat riwayat review.");
        }
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = localStorage.getItem("growtrack_token");
    if (!token) return;

    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const targetRole = form.get("target_role") as string;
    const resumeText = form.get("resume_text") as string;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/resume-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          target_role: targetRole,
          resume_text: resumeText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/resume-reviewer/${data.review.id}`);
      } else {
        alert("Gagal memproses resume. Pastikan teks tidak terlalu panjang.");
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
            <h1 className="mt-2 text-3xl font-bold">AI Resume Reviewer</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Evaluasi CV/Resume kamu untuk melihat kecocokannya dengan posisi idaman.
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Review CV Baru</h2>
          <p className="mb-4 mt-1 text-sm text-brand-muted">
            Buka file PDF Resume/CV kamu, tekan <strong>Ctrl+A (Select All)</strong> lalu <strong>Ctrl+C (Copy)</strong>, dan paste ke dalam kotak di bawah ini.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Target Posisi (Role)</label>
              <input
                type="text"
                name="target_role"
                required
                placeholder="Contoh: Frontend Developer, Product Manager..."
                className="w-full rounded-md border border-brand-border-strong px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Teks Resume (Paste di sini)</label>
              <textarea
                name="resume_text"
                required
                rows={8}
                placeholder="Paste seluruh isi teks CV kamu di sini..."
                className="w-full rounded-md border border-brand-border-strong px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full sm:w-auto self-start rounded-md bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {submitting ? "Menganalisis Resume..." : "Submit for Review"}
            </button>
          </form>
        </section>

        {error && (
          <div className="mb-6 rounded-md bg-status-error-bg p-4 text-sm text-status-error-text">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Riwayat Review</h2>
          
          {reviews.length === 0 ? (
            <p className="text-sm text-brand-muted">Belum ada riwayat review resume.</p>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="flex flex-col justify-between gap-4 rounded-lg border border-brand-border p-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-brand-text">{review.target_role}</h3>
                    <p className="text-xs text-brand-muted">
                      {new Date(review.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                      Skor: {review.score ?? 0}/100
                    </span>
                    <Link
                      href={`/dashboard/resume-reviewer/${review.id}`}
                      className="rounded-md border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-primary-dark transition hover:bg-brand-surface-strong"
                    >
                      Lihat Hasil
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
