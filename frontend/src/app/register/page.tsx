"use client";

import type { FormEvent, InputHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicNav } from "../components/PublicNav";

type CareerGoal = {
  id: number;
  audience: "employee" | "fresh_graduate";
  title: string;
  level: string;
  summary: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [role, setRole] = useState<"employee" | "fresh_graduate">("employee");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch(`${baseUrl}/register-options`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          setError("Career goal belum bisa dimuat dari backend.");
          return;
        }

        const payload = await response.json();
        setGoals(payload.career_goals ?? []);
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setOptionsLoading(false);
      }
    }

    loadOptions();
  }, [baseUrl]);

  const filteredGoals = useMemo(
    () => goals.filter((goal) => goal.audience === role),
    [goals, role],
  );

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const careerGoalId = Number(form.get("career_goal_id"));
    const selectedGoal = goals.find((goal) => goal.id === careerGoalId);

    try {
      const response = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role,
          career_goal_id: careerGoalId,
          department: null,
          current_position: role === "employee" ? "Belum diisi" : "Fresh Graduate",
          target_position: selectedGoal?.title ?? "Belum diisi",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Register gagal.");
        return;
      }

      localStorage.setItem("growtrack_token", payload.token);
      localStorage.setItem("growtrack_user", JSON.stringify(payload.user));
      const checkoutSlug = localStorage.getItem("growtrack_checkout_slug");

      if (checkoutSlug) {
        localStorage.removeItem("growtrack_checkout_slug");
        router.push(`/checkout/${checkoutSlug}`);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <PublicNav />
      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            GrowTrack Register
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
            Daftar dan lihat career journey milikmu.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-brand-muted">
            Cukup pilih tipe akun dan career goal. Detail profile bisa dilengkapi
            lewat dashboard setelah akun berhasil dibuat.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md border border-brand-border-strong px-4 py-2 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
          >
            Kembali ke login
          </Link>
        </section>

        <section className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-brand-primary-dark">Create account</p>
          <h2 className="mt-1 text-2xl font-semibold">Register singkat</h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Isi 5 data utama. Setelah register, sistem langsung membuat profile
            career awal berdasarkan goal yang dipilih.
          </p>

          {optionsLoading ? (
            <p className="mt-5 rounded-md bg-brand-surface-strong px-3 py-2 text-sm text-brand-muted">
              Memuat career goal...
            </p>
          ) : null}

          <form className="mt-6 grid gap-4" onSubmit={handleRegister}>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("employee")}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  role === "employee"
                    ? "border-brand-primary-dark bg-brand-surface-strong text-brand-primary-dark"
                    : "border-brand-border-strong text-brand-muted"
                }`}
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => setRole("fresh_graduate")}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  role === "fresh_graduate"
                    ? "border-brand-primary-dark bg-brand-surface-strong text-brand-primary-dark"
                    : "border-brand-border-strong text-brand-muted"
                }`}
              >
                Fresh Graduate
              </button>
            </div>

            <Input name="name" placeholder="Nama lengkap" required />
            <Input name="email" placeholder="Email" type="email" required />
            <div className="flex overflow-hidden rounded-md border border-brand-border-strong bg-white focus-within:border-brand-primary-dark focus-within:ring-2 focus-within:ring-brand-focus">
              <input
                name="password"
                placeholder="Password minimal 8 karakter"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                className="h-11 min-w-0 flex-1 px-3 text-sm outline-none"
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

            <select
              name="career_goal_id"
              className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
              required
            >
              <option value="">Pilih career goal</option>
              {filteredGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} - {goal.level}
                </option>
              ))}
            </select>

            {!filteredGoals.length && !optionsLoading ? (
              <p className="rounded-md border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm text-status-warning-text">
                Belum ada career goal untuk tipe user ini. Admin perlu membuat career goal dulu.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !filteredGoals.length}
              className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Mendaftarkan..." : "Register"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
    />
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
