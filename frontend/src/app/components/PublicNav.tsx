"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

type StoredUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navLinks = [
    { href: "/#assessment", label: "Assessment" },
    { href: "/#skill-gap", label: "Skill Gap" },
    { href: "/#roadmap", label: "Roadmap" },
    { href: "/#mentor", label: "Mentor" },
  ];
  const dashboardHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const dashboardLabel = user?.role === "admin" ? "Admin Panel" : "Dashboard";

  useEffect(() => {
    function readStoredUser() {
      const stored = localStorage.getItem("growtrack_user");

      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("growtrack_user");
        setUser(null);
      }
    }

    readStoredUser();
    window.addEventListener("storage", readStoredUser);

    return () => window.removeEventListener("storage", readStoredUser);
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    const token = localStorage.getItem("growtrack_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

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
      setUser(null);
      setMenuOpen(false);
      setLogoutOpen(false);
      setLogoutLoading(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-brand-border bg-white/90 shadow-brand-nav backdrop-blur-xl animate-nav-drop">
        <div className="bg-gradient-to-r from-brand-primary-hover via-brand-primary to-brand-accent px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:text-sm">
          AI Career Companion untuk mahasiswa, fresh graduate, dan profesional.
        </div>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-black text-brand-text transition hover:-translate-y-0.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-primary-hover text-sm text-white shadow-brand-logo-strong">P</span>
            Pathly AI
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border-strong text-brand-primary-dark transition hover:bg-brand-surface-strong active:scale-95 md:hidden"
            aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={menuOpen}
          >
            <span className="grid gap-1.5">
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
            </span>
          </button>

          <nav className="hidden items-center gap-1 text-sm font-bold text-brand-muted md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} className="rounded-md px-3 py-2 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark" href={link.href}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link className="rounded-md px-3 py-2 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark" href={dashboardHref}>
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="rounded-lg bg-brand-primary px-4 py-2 font-black text-white shadow-brand-logo transition hover:-translate-y-1 hover:bg-brand-primary-hover active:translate-y-0 active:scale-[0.98]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="rounded-md px-3 py-2 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark" href="/login">
                  Login
                </Link>
                <Link className="rounded-lg bg-brand-primary px-4 py-2 font-black text-white shadow-brand-logo transition hover:-translate-y-1 hover:bg-brand-primary-hover active:translate-y-0 active:scale-[0.98]" href="/register">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>

        {menuOpen ? (
          <nav className="animate-menu-open grid gap-1 border-t border-brand-border bg-white/95 px-4 py-3 text-sm font-bold text-brand-muted shadow-brand-menu backdrop-blur-xl md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="rounded-md px-3 py-3 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark"
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  className="rounded-md px-3 py-3 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark"
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                >
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  className="mt-1 rounded-lg bg-brand-primary px-3 py-3 text-center font-black text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
                  onClick={() => setLogoutOpen(true)}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-md px-3 py-3 transition hover:bg-brand-surface-strong hover:text-brand-primary-dark"
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  className="mt-1 rounded-lg bg-brand-primary px-3 py-3 text-center font-black text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        ) : null}
      </header>
      <LogoutConfirmModal
        open={logoutOpen}
        role={user?.role ?? "user"}
        loading={logoutLoading}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
