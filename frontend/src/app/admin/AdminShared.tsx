"use client";

import type {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";

export type CareerGoal = {
  id: number;
  audience: string;
  title: string;
  level: string;
  summary: string;
};

export type AdminData = {
  users: Array<{ id: number; name: string; email: string; role: string }>;
  career_goals: CareerGoal[];
  skills: Array<{ id: number; name: string; category: string; description: string }>;
  assessment_templates: Array<{ id: number; title: string; audience: string; question_count: number }>;
  roadmap_modules: Array<{ id: number; title: string; career_goal: string; sequence: number }>;
  skill_targets: Array<{ id: number; career_goal: string; skill: string; target_score: number }>;
  assessment_questions: Array<{
    id: number;
    assessment_template: string;
    skill: string;
    question: string;
    weight: number;
    max_score: number;
  }>;
};

export const emptyAdminData: AdminData = {
  users: [],
  career_goals: [],
  skills: [],
  assessment_templates: [],
  roadmap_modules: [],
  skill_targets: [],
  assessment_questions: [],
};

export function useAdminData() {
  const router = useRouter();
  const [data, setData] = useState<AdminData>(emptyAdminData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadData() {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/admin/bootstrap`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (response.status === 403 || response.status === 401) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        setError("Data admin gagal dimuat.");
        return;
      }

      setData(await response.json());
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(endpoint: string, payload: Record<string, unknown>) {
    setMessage("");
    setError("");
    const token = localStorage.getItem("growtrack_token");

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Data gagal disimpan.");
        return;
      }

      setMessage(result.message ?? "Data berhasil disimpan.");
      await loadData();
    } catch {
      setError("Backend belum bisa dihubungi.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, message, error, loading, loadData, submit };
}

export function AdminShell({
  title,
  eyebrow,
  body,
  data,
  message,
  error,
  onRefresh,
  children,
}: {
  title: string;
  eyebrow: string;
  body: string;
  data: AdminData;
  message: string;
  error: string;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function handleLogout() {
    setLogoutLoading(true);
    const token = localStorage.getItem("growtrack_token");

    try {
      if (token) {
        await fetch(`${baseUrl}/logout`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      localStorage.removeItem("growtrack_token");
      localStorage.removeItem("growtrack_user");
      setLogoutOpen(false);
      setLogoutLoading(false);
      setLogoutNotice("Logout admin berhasil. Mengarahkan ke halaman utama...");
      window.setTimeout(() => router.replace("/"), 650);
    }
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="animate-admin-enter rounded-lg border border-brand-border bg-white p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold">GrowTrack</h1>
          <p className="mt-2 text-sm leading-5 text-brand-primary-dark">
            Pusat kontrol data career goal, assessment, roadmap, dan user.
          </p>
          <nav className="mt-6 grid gap-2 text-sm font-medium">
            <AdminNavLink href="/admin" active={pathname === "/admin"}>Overview</AdminNavLink>
            <AdminNavLink href="/admin/master-data" active={pathname === "/admin/master-data"}>Master Data</AdminNavLink>
            <AdminNavLink href="/admin/assessment-setup" active={pathname === "/admin/assessment-setup"}>Assessment Setup</AdminNavLink>
            <AdminNavLink href="/admin/users" active={pathname === "/admin/users"}>Users</AdminNavLink>
            <AdminNavLink href="/admin/orders" active={pathname === "/admin/orders"}>Orders</AdminNavLink>
            <AdminNavLink href="/admin/preview" active={pathname === "/admin/preview"}>Preview Data</AdminNavLink>
            <Link className="rounded-md px-3 py-2 text-brand-muted transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98]" href="/dashboard">
              Dashboard
            </Link>
          </nav>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-6 h-10 w-full rounded-md border border-brand-border-strong text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="mt-3 h-10 w-full rounded-md bg-brand-primary-dark text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]"
          >
            Logout
          </button>
        </aside>

        <div className="animate-admin-enter [animation-delay:80ms]">
          <header className="rounded-lg border border-brand-border bg-brand-surface-strong p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
              {eyebrow}
            </p>
            <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">{body}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Metric label="Users" value={data.users.length} />
              <Metric label="Goals" value={data.career_goals.length} />
              <Metric label="Skills" value={data.skills.length} />
              <Metric label="Roadmap" value={data.roadmap_modules.length} />
              <Metric label="Targets" value={data.skill_targets.length} />
              <Metric label="Questions" value={data.assessment_questions.length} />
            </div>
          </header>

          {message ? (
            <p className="mt-5 animate-toast-in rounded-md border border-brand-border-strong bg-brand-surface-strong px-4 py-3 text-sm text-brand-primary-dark">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 animate-toast-in rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
              {error}
            </p>
          ) : null}
          {logoutNotice ? (
            <p className="mt-5 animate-toast-in rounded-md border border-brand-border-strong bg-brand-surface-strong px-4 py-3 text-sm text-brand-primary-dark">
              {logoutNotice}
            </p>
          ) : null}

          <div className="mt-6">{children}</div>
        </div>
      </div>
      <LogoutConfirmModal
        open={logoutOpen}
        role="admin"
        loading={logoutLoading}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

function AdminNavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      className={`rounded-md px-3 py-2 transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98] ${
        active ? "bg-brand-primary-dark text-white shadow-sm" : "text-brand-muted"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}

export function LoadingAdmin() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-surface px-5 text-brand-text">
      <div className="animate-refresh-loader w-full max-w-md rounded-lg border border-brand-border bg-white p-5 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-brand-primary-dark text-xl font-semibold text-white animate-refresh-pulse">
          G
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
          GrowTrack Admin
        </p>
        <p className="mt-2 text-lg font-semibold">Memuat data admin...</p>
        <div className="mt-5 grid gap-3 text-left">
          <div className="h-3 overflow-hidden rounded-sm bg-brand-surface-glow">
            <div className="h-full w-1/2 rounded-sm bg-brand-primary animate-refresh-bar" />
          </div>
          <div className="grid gap-2 rounded-lg bg-brand-surface p-3">
            <div className="h-3 w-3/4 rounded bg-brand-border animate-refresh-shimmer" />
            <div className="h-3 w-1/2 rounded bg-brand-border animate-refresh-shimmer [animation-delay:120ms]" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">{body}</p>
    </div>
  );
}

export function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      className="group animate-card-in rounded-lg border border-brand-border bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-accent hover:bg-brand-surface-strong hover:shadow-md active:translate-y-0 active:scale-[0.99]"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{title}</p>
        <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-surface-strong text-brand-primary-dark transition group-hover:translate-x-0.5 group-hover:bg-white">
          <ArrowRightIcon />
        </span>
      </div>
      <p className="mt-1 text-sm leading-5 text-brand-muted">{body}</p>
    </Link>
  );
}

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-brand-primary-dark">{label}</p>
    </div>
  );
}

export function PreviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="animate-card-in rounded-lg border border-brand-border bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-2 text-sm">
        {items.length ? (
          items.slice(0, 8).map((item) => (
            <div key={item} className="rounded-md bg-brand-surface px-3 py-2 text-brand-muted">
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-md bg-brand-surface px-3 py-2 text-brand-muted">{empty}</p>
        )}
      </div>
    </div>
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

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-11 rounded-md border border-brand-border-strong bg-white px-3 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
    />
  );
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-24 rounded-md border border-brand-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
    />
  );
}

function SubmitButton() {
  return (
    <button className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]">
      Simpan
    </button>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function CareerGoalForm({ onSubmit }: { onSubmit: (payload: Record<string, unknown>) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(form));
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="audience" required>
        <option value="employee">Karyawan</option>
        <option value="fresh_graduate">Fresh Graduate</option>
      </Select>
      <Input name="title" placeholder="Nama career goal" required />
      <Input name="level" placeholder="Level atau track" required />
      <Textarea name="summary" placeholder="Ringkasan tujuan karir" required />
      <SubmitButton />
    </form>
  );
}

export function SkillForm({ onSubmit }: { onSubmit: (payload: Record<string, unknown>) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(form));
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Input name="name" placeholder="Nama skill" required />
      <Input name="category" placeholder="Kategori skill" required />
      <Textarea name="description" placeholder="Deskripsi skill" required />
      <SubmitButton />
    </form>
  );
}

export function AssessmentForm({ onSubmit }: { onSubmit: (payload: Record<string, unknown>) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      ...Object.fromEntries(form),
      question_count: Number(form.get("question_count")),
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="audience" required>
        <option value="employee">Karyawan</option>
        <option value="fresh_graduate">Fresh Graduate</option>
      </Select>
      <Input name="title" placeholder="Judul assessment" required />
      <Input name="question_count" placeholder="Jumlah pertanyaan" type="number" min="1" required />
      <Textarea name="description" placeholder="Deskripsi assessment" required />
      <SubmitButton />
    </form>
  );
}

export function RoadmapForm({
  goals,
  onSubmit,
}: {
  goals: CareerGoal[];
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      ...Object.fromEntries(form),
      career_goal_id: Number(form.get("career_goal_id")),
      sequence: Number(form.get("sequence")),
      duration_hours: Number(form.get("duration_hours")),
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="career_goal_id" required>
        <option value="">Pilih career goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </Select>
      <Input name="sequence" placeholder="Urutan" type="number" min="1" required />
      <Input name="title" placeholder="Judul modul" required />
      <Input name="module_type" placeholder="Tipe modul" required />
      <Input name="duration_hours" placeholder="Durasi jam" type="number" min="1" required />
      <Textarea name="outcome" placeholder="Outcome modul" required />
      <SubmitButton />
    </form>
  );
}

export function UserForm({
  goals,
  onSubmit,
}: {
  goals: CareerGoal[];
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const careerGoalId = form.get("career_goal_id");

    onSubmit({
      ...Object.fromEntries(form),
      career_goal_id: careerGoalId ? Number(careerGoalId) : null,
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Input name="name" placeholder="Nama user" required />
      <Input name="email" placeholder="Email" type="email" required />
      <div className="flex overflow-hidden rounded-md border border-brand-border-strong bg-white focus-within:border-brand-primary-dark focus-within:ring-2 focus-within:ring-brand-focus">
        <input
          name="password"
          placeholder="Password awal"
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
      <Select name="role" required>
        <option value="employee">Employee</option>
        <option value="fresh_graduate">Fresh Graduate</option>
        <option value="mentor">Mentor</option>
        <option value="hr">HR</option>
        <option value="admin">Admin</option>
      </Select>
      <Select name="career_goal_id">
        <option value="">Tanpa profile career dulu</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </Select>
      <Input name="department" placeholder="Department" />
      <Input name="current_position" placeholder="Current position" />
      <Input name="target_position" placeholder="Target position" />
      <SubmitButton />
    </form>
  );
}

export function SkillTargetForm({
  goals,
  skills,
  onSubmit,
}: {
  goals: CareerGoal[];
  skills: AdminData["skills"];
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      career_goal_id: Number(form.get("career_goal_id")),
      skill_id: Number(form.get("skill_id")),
      target_score: Number(form.get("target_score")),
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="career_goal_id" required>
        <option value="">Pilih career goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </Select>
      <Select name="skill_id" required>
        <option value="">Pilih skill</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </Select>
      <Input name="target_score" placeholder="Target score 1-100" type="number" min="1" max="100" required />
      <SubmitButton />
    </form>
  );
}

export function AssessmentQuestionForm({
  templates,
  skills,
  onSubmit,
}: {
  templates: AdminData["assessment_templates"];
  skills: AdminData["skills"];
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      assessment_template_id: Number(form.get("assessment_template_id")),
      skill_id: Number(form.get("skill_id")),
      question: form.get("question"),
      weight: Number(form.get("weight")),
      max_score: Number(form.get("max_score")),
    });
    event.currentTarget.reset();
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="assessment_template_id" required>
        <option value="">Pilih assessment template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </Select>
      <Select name="skill_id" required>
        <option value="">Pilih skill</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </Select>
      <Textarea name="question" placeholder="Tulis pertanyaan assessment" required />
      <Input name="weight" placeholder="Weight" type="number" min="1" max="10" defaultValue={1} required />
      <Input name="max_score" placeholder="Max score" type="number" min="1" max="10" defaultValue={5} required />
      <SubmitButton />
    </form>
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
