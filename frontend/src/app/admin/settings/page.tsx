"use client";

import type { FormEvent } from "react";
import {
  AdminShell,
  LoadingAdmin,
  SectionHeader,
  useAdminData,
} from "../AdminShared";

export default function AdminSettingsPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function saveManualPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem("growtrack_token");
    const form = new FormData(event.currentTarget);

    await fetch(`${baseUrl}/admin/settings/manual-payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        manual_payment_instructions: form.get("manual_payment_instructions"),
      }),
    });

    await loadData();
  }

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Atur konfigurasi operasional."
      eyebrow="Settings"
      body="Kelola teks dan instruksi yang perlu bisa berubah tanpa edit kode atau redeploy frontend."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Payment"
        title="Instruksi transfer manual"
        body="Instruksi ini tampil di halaman checkout saat user memilih transfer manual."
      />
      <section className="mt-4 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <form className="grid gap-4" onSubmit={saveManualPayment}>
          <textarea
            name="manual_payment_instructions"
            defaultValue={data.settings.manual_payment_instructions ?? ""}
            placeholder="Contoh: Transfer ke rekening resmi, lalu tulis nama pengirim dan invoice pada catatan pembayaran."
            className="min-h-36 rounded-md border border-brand-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-brand-muted">
              Kosongkan jika instruksi pembayaran belum siap dipublish.
            </p>
            <button className="h-11 rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-deep active:translate-y-0 active:scale-[0.98]">
              Simpan Settings
            </button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
