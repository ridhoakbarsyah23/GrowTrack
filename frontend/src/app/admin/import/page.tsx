"use client";

import { useEffect, useState } from "react";
import {
  AdminShell,
  LoadingAdmin,
  SectionHeader,
  useAdminData,
} from "../AdminShared";

type ImportPreview = {
  valid: boolean;
  errors: string[];
  counts: Record<string, number>;
};

export default function AdminImportPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [localMessage, setLocalMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadPreview() {
    const token = localStorage.getItem("growtrack_token");

    setBusy(true);
    setLocalError("");
    setLocalMessage("");

    try {
      const response = await fetch(`${baseUrl}/admin/master-data-import/preview`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      setPreview(payload);

      if (!response.ok) {
        setLocalError(payload.message ?? "Template master data belum valid.");
      }
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
    } finally {
      setBusy(false);
    }
  }

  async function importMasterData() {
    const token = localStorage.getItem("growtrack_token");

    setBusy(true);
    setLocalError("");
    setLocalMessage("");

    try {
      const response = await fetch(`${baseUrl}/admin/master-data-import`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        setLocalError(payload.message ?? "Import master data gagal.");
        setPreview(payload);
        return;
      }

      setLocalMessage(payload.message ?? "Master data berhasil diimport.");
      setPreview({ valid: true, errors: [], counts: payload.counts ?? {} });
      await loadData();
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Import master data awal."
      eyebrow="Import Data"
      body="Preview template data Pathly AI, validasi jumlah item, lalu import ke database tanpa membuat duplikasi."
      data={data}
      message={message || localMessage}
      error={error || localError}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Template"
        title="Pathly master data template"
        body="Importer memakai file template yang sudah ada di backend. Jalankan preview sebelum import agar jumlah datanya jelas."
      />

      <section className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-primary-dark">Status template</p>
              <h2 className="mt-2 text-2xl font-semibold">{preview?.valid ? "Valid" : "Menunggu validasi"}</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Import aman dijalankan ulang karena data akan di-update berdasarkan key natural seperti title, slug, dan relasi.
              </p>
            </div>
            <span className={`rounded-md px-3 py-2 text-sm font-semibold ${preview?.valid ? "bg-brand-surface-strong text-brand-primary-dark" : "bg-status-warning-bg text-status-warning-text"}`}>
              {preview?.valid ? "Siap import" : "Perlu cek"}
            </span>
          </div>

          {preview?.errors?.length ? (
            <div className="mt-4 rounded-md border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error-text">
              <p className="font-semibold">Error template</p>
              <ul className="mt-2 list-disc pl-5 leading-6">
                {preview.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadPreview}
              disabled={busy}
              className="h-11 rounded-md border border-brand-border-strong px-4 text-sm font-semibold text-brand-primary-dark transition hover:-translate-y-0.5 hover:bg-brand-surface-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              Preview Template
            </button>
            <button
              type="button"
              onClick={importMasterData}
              disabled={busy || !preview?.valid}
              className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              Import Master Data
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Preview Counts</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(preview?.counts ?? {}).length ? (
              Object.entries(preview?.counts ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                  <p className="text-sm font-semibold text-brand-muted">{labelFromKey(key)}</p>
                  <p className="mt-2 text-3xl font-semibold text-brand-primary-dark">{value}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">
                Klik Preview Template untuk melihat jumlah data.
              </p>
            )}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function labelFromKey(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
