"use client";

import Link from "next/link";
import { useState } from "react";

export function PublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { href: "/#kursus", label: "Course" },
    { href: "/#webinar", label: "Webinar" },
    { href: "/#cara-beli", label: "Cara Beli" },
    { href: "/#roadmap", label: "Roadmap" },
    { href: "/#mentor", label: "Mentor" },
    { href: "/login", label: "Login" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/90 shadow-brand-nav backdrop-blur-xl animate-nav-drop">
      <div className="bg-gradient-to-r from-brand-primary-hover via-brand-primary to-brand-accent px-4 py-2 text-center text-xs font-semibold leading-5 text-white sm:text-sm">
        Launch course dan webinar dengan dashboard belajar GrowTrack.
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-brand-text transition hover:-translate-y-0.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-primary-hover text-sm text-white shadow-brand-logo-strong">G</span>
          GrowTrack
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
          <Link className="rounded-lg bg-brand-primary px-4 py-2 font-black text-white shadow-brand-logo transition hover:-translate-y-1 hover:bg-brand-primary-hover active:translate-y-0 active:scale-[0.98]" href="/register">
            Register
          </Link>
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
          <Link
            className="mt-1 rounded-lg bg-brand-primary px-3 py-3 text-center font-black text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
            href="/register"
            onClick={() => setMenuOpen(false)}
          >
            Register
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
