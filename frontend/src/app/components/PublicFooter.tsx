"use client";

import Image from "next/image";
import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-gradient-to-b from-white to-brand-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-2 text-xl font-black text-brand-text">
            <Image
              src="/brand/pathly-logo-mark.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg shadow-brand-logo"
              aria-hidden="true"
            />
            Pathly AI
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-brand-muted">
            AI Career Companion untuk assessment karier, skill gap, roadmap personal,
            progress tracking, dan feedback mentor.
          </p>
        </div>
        <FooterGroup title="Produk" links={["Career Assessment", "Skill Gap", "Roadmap"]} />
        <FooterGroup title="Platform" links={["Dashboard", "Mentor Feedback", "Admin"]} />
        <div>
          <p className="text-sm font-black text-brand-text">Akses</p>
          <nav className="mt-4 grid gap-3 text-sm font-semibold text-brand-muted">
            <Link className="transition hover:text-brand-primary" href="/login">Login</Link>
            <Link className="transition hover:text-brand-primary" href="/register">Register</Link>
            <Link className="transition hover:text-brand-primary" href="/forgot-password">Reset Password</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-brand-border px-4 py-4 sm:px-5">
        <p className="mx-auto max-w-7xl text-sm font-medium text-brand-muted">
          &copy; {currentYear} Pathly AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-black text-brand-text">{title}</p>
      <div className="mt-4 grid gap-3 text-sm font-semibold text-brand-muted">
        {links.map((link) => (
          <span key={link}>{link}</span>
        ))}
      </div>
    </div>
  );
}
