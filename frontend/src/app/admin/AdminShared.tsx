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
  assessment_templates: Array<{ id: number; title: string; audience: string; description: string; question_count: number }>;
  roadmap_modules: Array<{
    id: number;
    career_goal_id: number;
    title: string;
    career_goal: string;
    sequence: number;
    module_type: string;
    duration_hours: number;
    outcome: string;
  }>;
  skill_targets: Array<{
    id: number;
    career_goal_id: number;
    skill_id: number;
    career_goal: string;
    skill: string;
    target_score: number;
  }>;
  assessment_questions: Array<{
    id: number;
    assessment_template_id: number;
    skill_id: number;
    assessment_template: string;
    skill: string;
    question: string;
    weight: number;
    max_score: number;
  }>;
  learning_products: Array<{
    id: number;
    type: "course" | "webinar";
    title: string;
    slug: string;
    category: string;
    level: string | null;
    price: number;
    description: string;
    outcome: string;
    lesson_count: number;
    duration: string | null;
    scheduled_at: string | null;
    seat_limit: number | null;
    meeting_url: string | null;
    material_url: string | null;
    status: "active" | "inactive";
    created_at: string;
  }>;
  project_submissions: Array<{
    id: number;
    user_profile_id: number;
    roadmap_module_id: number;
    title: string;
    description: string;
    status: "submitted" | "reviewed" | "revision_needed";
    score: number | null;
    review_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    learner_name: string;
    learner_email: string;
    career_goal: string;
    module_title: string;
    reviewer_name: string | null;
  }>;
  user_profiles: Array<{
    id: number;
    name: string;
    email: string;
    role: "employee" | "fresh_graduate";
    current_position: string | null;
    target_position: string;
    career_goal: string;
  }>;
  mentor_feedback: Array<{
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
  learning_products: [],
  project_submissions: [],
  user_profiles: [],
  mentor_feedback: [],
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
    <main className="min-h-screen bg-brand-panel-soft text-brand-text">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="animate-admin-enter rounded-lg border border-brand-primary-deep bg-brand-text p-4 text-white shadow-md lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-border">
            Admin Console
          </p>
          <h1 className="mt-2 text-2xl font-semibold">GrowTrack</h1>
          <p className="mt-2 text-sm leading-5 text-white/70">
            Area operasional untuk data, user, catalog, review evidence, dan mentor feedback.
          </p>
          <nav className="mt-6 grid gap-2 text-sm font-medium">
            <AdminNavLink href="/admin" active={pathname === "/admin"}>Overview</AdminNavLink>
            <AdminNavLink href="/admin/master-data" active={pathname === "/admin/master-data"}>Master Data</AdminNavLink>
            <AdminNavLink href="/admin/assessment-setup" active={pathname === "/admin/assessment-setup"}>Assessment Setup</AdminNavLink>
            <AdminNavLink href="/admin/products" active={pathname === "/admin/products"}>Products</AdminNavLink>
            <AdminNavLink href="/admin/evidence" active={pathname === "/admin/evidence"}>Evidence</AdminNavLink>
            <AdminNavLink href="/admin/mentor-feedback" active={pathname === "/admin/mentor-feedback"}>Mentor Feedback</AdminNavLink>
            <AdminNavLink href="/admin/users" active={pathname === "/admin/users"}>Users</AdminNavLink>
            <AdminNavLink href="/admin/orders" active={pathname === "/admin/orders"}>Orders</AdminNavLink>
            <AdminNavLink href="/admin/preview" active={pathname === "/admin/preview"}>Preview Data</AdminNavLink>
            <Link className="rounded-md px-3 py-2 text-white/70 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:translate-y-0 active:scale-[0.98]" href="/dashboard">
              User Dashboard
            </Link>
          </nav>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-6 h-10 w-full rounded-md border border-white/20 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 active:scale-[0.98]"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="mt-3 h-10 w-full rounded-md bg-white text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong active:translate-y-0 active:scale-[0.98]"
          >
            Logout
          </button>
        </aside>

        <div className="animate-admin-enter [animation-delay:80ms]">
          <header className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
              {eyebrow}
            </p>
            <h2 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">{body}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
              <Metric label="Users" value={data.users.length} />
              <Metric label="Goals" value={data.career_goals.length} />
              <Metric label="Skills" value={data.skills.length} />
              <Metric label="Roadmap" value={data.roadmap_modules.length} />
              <Metric label="Targets" value={data.skill_targets.length} />
              <Metric label="Questions" value={data.assessment_questions.length} />
              <Metric label="Products" value={data.learning_products.length} />
              <Metric label="Evidence" value={data.project_submissions.length} />
              <Metric label="Feedback" value={data.mentor_feedback.length} />
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
      className={`rounded-md px-3 py-2 transition hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
        active ? "bg-white text-brand-primary-dark shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
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

export function CareerGoalForm({
  goal,
  onSubmit,
}: {
  goal?: CareerGoal | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(form));

    if (!goal) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="audience" defaultValue={goal?.audience ?? "employee"} required>
        <option value="employee">Karyawan</option>
        <option value="fresh_graduate">Fresh Graduate</option>
      </Select>
      <Input name="title" placeholder="Nama career goal" defaultValue={goal?.title ?? ""} required />
      <Input name="level" placeholder="Level atau track" defaultValue={goal?.level ?? ""} required />
      <Textarea name="summary" placeholder="Ringkasan tujuan karir" defaultValue={goal?.summary ?? ""} required />
      <SubmitButton />
    </form>
  );
}

export function SkillForm({
  skill,
  onSubmit,
}: {
  skill?: AdminData["skills"][number] | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(form));

    if (!skill) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Input name="name" placeholder="Nama skill" defaultValue={skill?.name ?? ""} required />
      <Input name="category" placeholder="Kategori skill" defaultValue={skill?.category ?? ""} required />
      <Textarea name="description" placeholder="Deskripsi skill" defaultValue={skill?.description ?? ""} required />
      <SubmitButton />
    </form>
  );
}

export function AssessmentForm({
  template,
  onSubmit,
}: {
  template?: AdminData["assessment_templates"][number] | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      ...Object.fromEntries(form),
      question_count: Number(form.get("question_count")),
    });

    if (!template) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="audience" defaultValue={template?.audience ?? "employee"} required>
        <option value="employee">Karyawan</option>
        <option value="fresh_graduate">Fresh Graduate</option>
      </Select>
      <Input name="title" placeholder="Judul assessment" defaultValue={template?.title ?? ""} required />
      <Input name="question_count" placeholder="Jumlah pertanyaan" type="number" min="1" defaultValue={template?.question_count ?? ""} required />
      <Textarea name="description" placeholder="Deskripsi assessment" defaultValue={template?.description ?? ""} required />
      <SubmitButton />
    </form>
  );
}

export function RoadmapForm({
  goals,
  module,
  onSubmit,
}: {
  goals: CareerGoal[];
  module?: AdminData["roadmap_modules"][number] | null;
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

    if (!module) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="career_goal_id" defaultValue={module?.career_goal_id ?? ""} required>
        <option value="">Pilih career goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </Select>
      <Input name="sequence" placeholder="Urutan" type="number" min="1" defaultValue={module?.sequence ?? ""} required />
      <Input name="title" placeholder="Judul modul" defaultValue={module?.title ?? ""} required />
      <Input name="module_type" placeholder="Tipe modul" defaultValue={module?.module_type ?? ""} required />
      <Input name="duration_hours" placeholder="Durasi jam" type="number" min="1" defaultValue={module?.duration_hours ?? ""} required />
      <Textarea name="outcome" placeholder="Outcome modul" defaultValue={module?.outcome ?? ""} required />
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
  target,
  onSubmit,
}: {
  goals: CareerGoal[];
  skills: AdminData["skills"];
  target?: AdminData["skill_targets"][number] | null;
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

    if (!target) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="career_goal_id" defaultValue={target?.career_goal_id ?? ""} required>
        <option value="">Pilih career goal</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </Select>
      <Select name="skill_id" defaultValue={target?.skill_id ?? ""} required>
        <option value="">Pilih skill</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </Select>
      <Input name="target_score" placeholder="Target score 1-100" type="number" min="1" max="100" defaultValue={target?.target_score ?? ""} required />
      <SubmitButton />
    </form>
  );
}

export function AssessmentQuestionForm({
  templates,
  skills,
  question,
  onSubmit,
}: {
  templates: AdminData["assessment_templates"];
  skills: AdminData["skills"];
  question?: AdminData["assessment_questions"][number] | null;
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

    if (!question) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="assessment_template_id" defaultValue={question?.assessment_template_id ?? ""} required>
        <option value="">Pilih assessment template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </Select>
      <Select name="skill_id" defaultValue={question?.skill_id ?? ""} required>
        <option value="">Pilih skill</option>
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.name}
          </option>
        ))}
      </Select>
      <Textarea name="question" placeholder="Tulis pertanyaan assessment" defaultValue={question?.question ?? ""} required />
      <Input name="weight" placeholder="Weight" type="number" min="1" max="10" defaultValue={question?.weight ?? 1} required />
      <Input name="max_score" placeholder="Max score" type="number" min="1" max="10" defaultValue={question?.max_score ?? 5} required />
      <SubmitButton />
    </form>
  );
}

export function ProductForm({
  product,
  onSubmit,
}: {
  product?: AdminData["learning_products"][number] | null;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit({
      type: form.get("type"),
      title: form.get("title"),
      slug: form.get("slug"),
      category: form.get("category"),
      level: emptyToNull(form.get("level")),
      price: Number(form.get("price")),
      description: form.get("description"),
      outcome: form.get("outcome"),
      lesson_count: Number(form.get("lesson_count") || 0),
      duration: emptyToNull(form.get("duration")),
      scheduled_at: emptyToNull(form.get("scheduled_at")),
      seat_limit: numberOrNull(form.get("seat_limit")),
      meeting_url: emptyToNull(form.get("meeting_url")),
      material_url: emptyToNull(form.get("material_url")),
      status: form.get("status"),
    });

    if (!product) {
      event.currentTarget.reset();
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <Select name="type" defaultValue={product?.type ?? "course"} required>
        <option value="course">Course</option>
        <option value="webinar">Webinar</option>
      </Select>
      <Input name="title" placeholder="Judul produk" defaultValue={product?.title ?? ""} required />
      <Input name="slug" placeholder="slug-produk-opsional" defaultValue={product?.slug ?? ""} />
      <Input name="category" placeholder="Kategori" defaultValue={product?.category ?? ""} required />
      <Input name="level" placeholder="Level" defaultValue={product?.level ?? ""} />
      <Input name="price" placeholder="Harga" type="number" min="0" defaultValue={product?.price ?? ""} required />
      <Textarea name="description" placeholder="Deskripsi produk" defaultValue={product?.description ?? ""} required />
      <Textarea name="outcome" placeholder="Outcome setelah ikut produk" defaultValue={product?.outcome ?? ""} required />
      <Input name="lesson_count" placeholder="Jumlah lesson" type="number" min="0" max="255" defaultValue={product?.lesson_count ?? 0} />
      <Input name="duration" placeholder="Durasi, contoh: 4 minggu / 2 jam" defaultValue={product?.duration ?? ""} />
      <Input name="scheduled_at" type="datetime-local" defaultValue={toDateTimeLocal(product?.scheduled_at)} />
      <Input name="seat_limit" placeholder="Kuota webinar" type="number" min="1" defaultValue={product?.seat_limit ?? ""} />
      <Input name="meeting_url" placeholder="Link meeting webinar" type="url" defaultValue={product?.meeting_url ?? ""} />
      <Input name="material_url" placeholder="Link materi course" type="url" defaultValue={product?.material_url ?? ""} />
      <Select name="status" defaultValue={product?.status ?? "active"} required>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
      <SubmitButton />
    </form>
  );
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text ? text : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text ? Number(text) : null;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16).replace(" ", "T");
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
