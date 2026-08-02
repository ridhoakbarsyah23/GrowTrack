"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { PublicNav } from "../components/PublicNav";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setToken("");
    setLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Reset password gagal dibuat.");
        return;
      }

      setMessage(payload.message ?? "Instruksi reset password berhasil dibuat.");
      setToken(payload.reset_token ?? "");
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <PublicNav />
      <section className="mx-auto mt-10 w-full max-w-lg rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-brand-primary-dark">Pathly AI</p>
        <h1 className="mt-1 text-2xl font-semibold">Forgot Password</h1>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Masukkan email akunmu. Untuk mode development, token reset akan tampil di halaman ini.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
            placeholder="Email"
            type="email"
            required
          />
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
          {token ? (
            <div className="rounded-md border border-brand-border bg-brand-panel-soft p-3">
              <p className="text-sm font-semibold">Reset token</p>
              <p className="mt-2 break-all text-xs text-brand-muted">{token}</p>
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`}
                className="mt-3 inline-flex rounded-md bg-brand-primary-dark px-3 py-2 text-sm font-semibold text-white"
              >
                Lanjut reset password
              </Link>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Buat reset token"}
          </button>
        </form>

      <Link href="/login" className="mt-4 inline-flex text-sm font-semibold text-brand-primary-dark hover:underline">
        Kembali ke login
      </Link>
      </section>
    </main>
  );
}
