"use client";

export function LogoutConfirmModal({
  open,
  loading = false,
  role = "user",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  role?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  const content = getLogoutContent(role);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-text/45 px-5 backdrop-blur-sm animate-modal-overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="w-full max-w-md rounded-lg border border-brand-border bg-white p-5 text-brand-text shadow-xl animate-modal-in"
      >
        <div className="grid h-12 w-12 place-items-center rounded-md bg-brand-surface-strong text-brand-primary-dark">
          <LogoutIcon />
        </div>
        <h2 id="logout-title" className="mt-4 text-xl font-semibold">
          {content.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          {content.body}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-md border border-brand-border-strong text-sm font-semibold text-brand-primary-dark transition hover:bg-brand-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-md bg-brand-primary-dark text-sm font-semibold text-white transition hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Memproses..." : content.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function getLogoutContent(role: string) {
  if (role === "admin") {
    return {
      title: "Keluar dari panel admin?",
      body: "Sesi admin akan ditutup. Pastikan data master, assessment, roadmap, atau user yang sedang diinput sudah disimpan.",
      confirmLabel: "Ya, keluar admin",
    };
  }

  if (role === "fresh_graduate") {
    return {
      title: "Keluar dari dashboard fresh graduate?",
      body: "Sesi kamu akan ditutup. Progress assessment dan roadmap yang sudah tersimpan tetap aman di database.",
      confirmLabel: "Ya, logout",
    };
  }

  if (role === "employee") {
    return {
      title: "Keluar dari dashboard karyawan?",
      body: "Sesi kamu akan ditutup. Data career journey, assessment, dan readiness report yang sudah tersimpan tetap aman.",
      confirmLabel: "Ya, logout",
    };
  }

  return {
    title: "Keluar dari GrowTrack?",
    body: "Sesi kamu akan ditutup. Data yang sudah tersimpan tetap aman di database.",
    confirmLabel: "Ya, logout",
  };
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
