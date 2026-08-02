"use client";

import type { FormEvent, ReactNode } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicNav } from "../components/PublicNav";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetShell>Memuat reset password...</ResetShell>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, token, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Reset password gagal.");
        return;
      }

      setMessage(payload.message ?? "Password berhasil direset.");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResetShell>
      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
          placeholder="Email"
          type="email"
          required
        />
        <textarea
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="min-h-24 rounded-md border border-brand-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
          placeholder="Reset token"
          required
        />
        <div className="flex overflow-hidden rounded-md border border-brand-border-strong bg-white focus-within:border-brand-primary-dark focus-within:ring-2 focus-within:ring-brand-focus">
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
            placeholder="Password baru minimal 8 karakter"
            type={showPassword ? "text" : "password"}
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="grid w-12 place-items-center border-l border-brand-border-strong text-brand-primary-dark hover:bg-brand-surface-strong"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <p className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-md border border-brand-border-strong bg-brand-surface-strong px-3 py-2 text-sm text-brand-primary-dark">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Menyimpan..." : "Reset password"}
        </button>
      </form>
    </ResetShell>
  );
}

function ResetShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <PublicNav />
      <section className="mx-auto mt-10 w-full max-w-lg rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-brand-primary-dark">Pathly AI</p>
        <h1 className="mt-1 text-2xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Masukkan email, token reset, dan password baru.
        </p>
        {children}
        <Link href="/login" className="mt-4 inline-flex text-sm font-semibold text-brand-primary-dark hover:underline">
          Kembali ke login
        </Link>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
      <path d="M9.9 5.2A10.3 10.3 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.2" />
      <path d="M6.1 6.8C3.5 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5-1.4" />
    </svg>
  );
}
