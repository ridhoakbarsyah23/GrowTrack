"use client";

import { useEffect, useState } from "react";
import {
  AdminShell,
  LoadingAdmin,
  useAdminData,
} from "../AdminShared";

type AdminOrder = {
  id: number;
  invoice_number: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  payment_method: string;
  payment_note: string | null;
  paid_at: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  product_title: string;
  product_type: "course" | "webinar";
};

export default function AdminOrdersPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersMessage, setOrdersMessage] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

  async function loadOrders() {
    const token = localStorage.getItem("growtrack_token");

    if (!token) {
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch(`${baseUrl}/admin/orders`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setOrdersError("Order gagal dimuat.");
        return;
      }

      const payload = await response.json();
      setOrders(payload.orders ?? []);
    } catch {
      setOrdersError("Backend belum bisa dihubungi.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function updateStatus(orderId: number, status: AdminOrder["status"]) {
    const token = localStorage.getItem("growtrack_token");
    setOrdersMessage("");
    setOrdersError("");

    try {
      const response = await fetch(`${baseUrl}/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setOrdersError(payload.message ?? "Status order gagal diperbarui.");
        return;
      }

      setOrdersMessage(payload.message ?? "Status order berhasil diperbarui.");
      await loadOrders();
    } catch {
      setOrdersError("Backend belum bisa dihubungi.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Kelola order course dan webinar."
      eyebrow="Commerce Orders"
      body="Approve pembayaran manual dari halaman ini. Status paid akan membuka akses materi course atau link webinar di dashboard user."
      data={data}
      message={message || ordersMessage}
      error={error || ordersError}
      onRefresh={() => {
        loadData();
        loadOrders();
      }}
    >
      <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Manual Payment</p>
            <h2 className="mt-2 text-xl font-semibold">Order Masuk</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Ubah order menjadi paid setelah pembayaran diterima.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
          >
            Refresh order
          </button>
        </div>

        {ordersLoading ? (
          <p className="mt-5 rounded-md bg-brand-surface-strong px-3 py-2 text-sm text-brand-muted">Memuat order...</p>
        ) : orders.length ? (
          <div className="mt-5 grid gap-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                      {order.invoice_number} - {order.product_type}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{order.product_title}</h3>
                    <p className="mt-1 text-sm text-brand-muted">{order.customer_name} - {order.customer_email}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-text">{formatRupiah(order.amount)}</p>
                    {order.payment_note ? (
                      <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-brand-muted">
                        {order.payment_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid min-w-40 gap-2">
                    <span className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${order.status === "paid" ? "bg-brand-surface-strong text-brand-primary-dark" : order.status === "cancelled" ? "bg-status-error-bg text-status-error-text" : "bg-status-warning-bg text-status-warning-text"}`}>
                      {order.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "paid")}
                      disabled={order.status === "paid"}
                      className="h-10 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Mark paid
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "cancelled")}
                      disabled={order.status === "cancelled"}
                      className="h-10 rounded-md border border-status-error-border px-3 text-sm font-semibold text-status-error-text hover:bg-status-error-bg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">
            Belum ada order masuk.
          </p>
        )}
      </section>
    </AdminShell>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
