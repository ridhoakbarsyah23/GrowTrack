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
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const paidOrders = orders.filter((order) => order.status === "paid");
  const cancelledOrders = orders.filter((order) => order.status === "cancelled");
  const paidRevenue = paidOrders.reduce((total, order) => total + order.amount, 0);

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
    const order = orders.find((item) => item.id === orderId);

    if (order && status !== "pending") {
      const action = status === "paid" ? "approve pembayaran" : "cancel order";
      const confirmed = window.confirm(`Yakin ${action} untuk invoice ${order.invoice_number}?`);

      if (!confirmed) {
        return;
      }
    }

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
      <section className="grid gap-3 sm:grid-cols-4">
        <OrderMetric label="Pending" value={pendingOrders.length} body="Butuh verifikasi admin." tone={pendingOrders.length ? "warning" : "normal"} />
        <OrderMetric label="Paid" value={paidOrders.length} body="Akses user sudah terbuka." />
        <OrderMetric label="Cancelled" value={cancelledOrders.length} body="Order tidak aktif." tone="muted" />
        <OrderMetric label="Revenue paid" value={formatRupiah(paidRevenue)} body="Total dari order paid." />
      </section>

      <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Manual Payment</p>
            <h2 className="mt-2 text-xl font-semibold">Order Masuk</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Ubah order menjadi paid setelah pembayaran diterima. Order pending diprioritaskan untuk dicek lebih dulu.
            </p>
            {pendingOrders.length ? (
              <p className="mt-3 rounded-md border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm font-semibold text-status-warning-text">
                {pendingOrders.length} order menunggu verifikasi pembayaran.
              </p>
            ) : null}
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
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                      {order.invoice_number} - {order.product_type}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{order.product_title}</h3>
                    <p className="mt-1 text-sm text-brand-muted">{order.customer_name} - {order.customer_email}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-text">{formatRupiah(order.amount)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <OrderBadge label={paymentMethodLabel(order.payment_method)} />
                      <OrderBadge label={`Dibuat ${formatDate(order.created_at)}`} />
                      {order.paid_at ? <OrderBadge label={`Paid ${formatDate(order.paid_at)}`} /> : null}
                    </div>
                    {order.payment_note ? (
                      <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm leading-6 text-brand-muted">
                        {order.payment_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid w-full gap-2 sm:w-[160px]">
                    <span className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${statusClassName(order.status)}`}>
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
                    {order.status !== "pending" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, "pending")}
                        className="h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white"
                      >
                        Reopen pending
                      </button>
                    ) : null}
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

function OrderMetric({ label, value, body, tone = "normal" }: { label: string; value: number | string; body: string; tone?: "normal" | "warning" | "muted" }) {
  const className = tone === "warning"
    ? "border-status-warning-border bg-status-warning-bg text-status-warning-text"
    : tone === "muted"
      ? "border-brand-border bg-brand-panel-soft text-brand-muted"
      : "border-brand-border bg-white text-brand-primary-dark";

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-text">{value}</p>
      <p className="mt-1 text-sm leading-5">{body}</p>
    </div>
  );
}

function OrderBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-brand-primary-dark">
      {label}
    </span>
  );
}

function statusClassName(status: AdminOrder["status"]) {
  if (status === "paid") {
    return "bg-brand-surface-strong text-brand-primary-dark";
  }

  if (status === "cancelled") {
    return "bg-status-error-bg text-status-error-text";
  }

  return "bg-status-warning-bg text-status-warning-text";
}

function paymentMethodLabel(method: string) {
  if (method === "manual_transfer") {
    return "Manual transfer";
  }

  if (method === "midtrans_snap") {
    return "Midtrans Snap";
  }

  return method;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
