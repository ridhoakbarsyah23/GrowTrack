"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicNav } from "../components/PublicNav";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Login gagal.");
        return;
      }

      localStorage.setItem("growtrack_token", payload.token);
      localStorage.setItem("growtrack_user", JSON.stringify(payload.user));
      const checkoutSlug = localStorage.getItem("growtrack_checkout_slug");

      if (checkoutSlug && payload.user.role !== "admin") {
        localStorage.removeItem("growtrack_checkout_slug");
        router.push(`/checkout/${checkoutSlug}`);
        return;
      }

      router.push(payload.user.role === "admin" ? "/admin" : "/");
    } catch {
      setError("Backend belum bisa dihubungi. Pastikan Laravel sudah running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <PublicNav />
      <section className="mx-auto grid min-h-[calc(100vh-154px)] max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Secure Access
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
            Masuk ke dashboard GrowTrack.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-brand-muted">
            Gunakan akun admin, HR, mentor, employee, atau fresh graduate untuk mengakses
            data karir dan readiness report sesuai role.
          </p>
        </div>

        <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-brand-primary-dark">Welcome back</p>
          <h2 className="mt-1 text-2xl font-semibold">Login GrowTrack</h2>

          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Password</span>
              <div className="flex overflow-hidden rounded-md border border-brand-border-strong bg-white focus-within:border-brand-primary-dark focus-within:ring-2 focus-within:ring-brand-focus">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            </label>

            {error ? (
              <p className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-brand-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-brand-primary-dark hover:underline">
              Register sebagai user
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-brand-muted">
            Lupa password?{" "}
            <Link href="/forgot-password" className="font-semibold text-brand-primary-dark hover:underline">
              Reset password
            </Link>
          </p>
        </section>
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
