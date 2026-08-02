"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PublicNav } from "../../components/PublicNav";

type Product = {
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
};

type Order = {
  id: number;
  invoice_number: string;
  product_id: number;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  payment_method: string;
  payment_provider: string | null;
  payment_reference: string | null;
  payment_url: string | null;
  payment_note: string | null;
  paid_at: string | null;
  created_at: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"midtrans_snap" | "manual_transfer">("midtrans_snap");
  const authToken = useSyncExternalStore(subscribeToAuthToken, getAuthTokenSnapshot, getServerAuthTokenSnapshot);

  const product = useMemo(
    () => products.find((item) => item.slug === slug) ?? null,
    [products, slug],
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${baseUrl}/products`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          setError("Produk belum bisa dimuat dari backend.");
          return;
        }

        const payload = await response.json();
        setProducts(payload.products ?? []);
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [baseUrl]);

  function rememberCheckout() {
    localStorage.setItem("growtrack_checkout_slug", slug);
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product) {
      return;
    }

    const activeToken = localStorage.getItem("growtrack_token");

    if (!activeToken) {
      rememberCheckout();
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          payment_method: paymentMethod,
          payment_note: form.get("payment_note"),
        }),
      });
      const payload = await response.json();

      if (!response.ok && response.status !== 202) {
        setError(payload.message ?? "Order gagal dibuat.");
        return;
      }

      setOrder(payload.order);
      setMessage(payload.message ?? "Order berhasil dibuat.");

      if (payload.order?.payment_url) {
        window.setTimeout(() => {
          window.location.assign(payload.order.payment_url);
        }, 450);
      }
    } catch {
      setError("Backend belum bisa dihubungi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-surface text-brand-text">
      <PublicNav />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
          <Link href="/#kursus" className="text-sm font-semibold text-brand-primary-dark hover:underline">
            Kembali ke katalog
          </Link>

          {loading ? (
            <div className="mt-6 grid gap-3">
              <div className="h-6 w-40 animate-pulse rounded bg-brand-border" />
              <div className="h-12 w-full animate-pulse rounded bg-brand-surface-strong" />
              <div className="h-28 w-full animate-pulse rounded bg-brand-surface-strong" />
            </div>
          ) : product ? (
            <>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
                {product.type === "course" ? "Course Checkout" : "Webinar Checkout"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">{product.title}</h1>
              <p className="mt-4 text-base leading-7 text-brand-muted">{product.description}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Kategori" value={product.category} />
                <Metric label="Durasi" value={product.duration ?? "-"} />
                <Metric label={product.type === "course" ? "Materi" : "Kuota"} value={product.type === "course" ? `${product.lesson_count} lesson` : `${product.seat_limit ?? 0} seat`} />
              </div>

              <div className="mt-5 rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                <p className="text-sm font-semibold text-brand-primary-dark">Outcome</p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">{product.outcome}</p>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-status-error-border bg-status-error-bg p-4">
              <p className="font-semibold text-status-error-text">Produk tidak ditemukan</p>
              <p className="mt-2 text-sm text-status-error-text">Pastikan produk sudah ada di database dan statusnya aktif.</p>
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-brand-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-brand-primary-dark">Total pembayaran</p>
          <p className="mt-2 text-4xl font-black text-brand-primary">{product ? formatRupiah(product.price) : "-"}</p>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            Pilih pembayaran otomatis lewat Midtrans Snap atau transfer manual jika gateway belum dikonfigurasi.
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("midtrans_snap")}
              className={`rounded-lg border p-4 text-left transition ${
                paymentMethod === "midtrans_snap"
                  ? "border-brand-primary bg-brand-surface-strong text-brand-primary-dark"
                  : "border-brand-border bg-white text-brand-muted hover:bg-brand-surface"
              }`}
            >
              <span className="block text-sm font-bold">Midtrans Snap</span>
              <span className="mt-1 block text-xs leading-5">
                Bayar via VA, e-wallet, QRIS, kartu, dan metode lain yang aktif di akun Midtrans.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("manual_transfer")}
              className={`rounded-lg border p-4 text-left transition ${
                paymentMethod === "manual_transfer"
                  ? "border-brand-primary bg-brand-surface-strong text-brand-primary-dark"
                  : "border-brand-border bg-white text-brand-muted hover:bg-brand-surface"
              }`}
            >
              <span className="block text-sm font-bold">Transfer Manual</span>
              <span className="mt-1 block text-xs leading-5">
                Admin akan mengecek pembayaran dan mengaktifkan akses secara manual.
              </span>
            </button>
          </div>

          {paymentMethod === "manual_transfer" ? (
            <div className="mt-5 rounded-lg border border-brand-border bg-brand-surface p-4">
              <p className="font-semibold">Instruksi transfer</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Transfer ke BCA 1234567890 a.n. Pathly AI Demo, lalu isi catatan pembayaran.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-brand-border bg-brand-surface p-4">
              <p className="font-semibold">Pembayaran otomatis</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Setelah order dibuat, kamu akan diarahkan ke halaman pembayaran aman dari Midtrans.
              </p>
            </div>
          )}

          {order ? (
            <div className="mt-5 rounded-lg border border-brand-border-strong bg-brand-surface-strong p-4 text-brand-primary-dark">
              <p className="font-semibold">Order dibuat</p>
              <p className="mt-2 text-sm">Invoice: {order.invoice_number}</p>
              <p className="mt-1 text-sm">Status: {order.status}</p>
              {order.payment_url ? (
                <a href={order.payment_url} className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white">
                  Buka Pembayaran
                </a>
              ) : (
                <Link href="/dashboard" className="mt-4 inline-flex h-10 items-center rounded-md bg-brand-primary-dark px-4 text-sm font-semibold text-white">
                  Lihat Dashboard
                </Link>
              )}
            </div>
          ) : (
            <form className="mt-5 grid gap-3" onSubmit={handleCheckout}>
              <textarea
                name="payment_note"
                placeholder={paymentMethod === "manual_transfer" ? "Catatan pembayaran, contoh: transfer dari BCA Ridho" : "Catatan opsional untuk order ini"}
                className="min-h-24 rounded-md border border-brand-border-strong bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-focus"
              />

              {!authToken ? (
                <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-3 text-sm leading-6 text-status-warning-text">
                  Kamu perlu login atau register dulu sebelum membuat order.
                </div>
              ) : null}

              {message ? <p className="rounded-md border border-brand-border-strong bg-brand-surface-strong px-3 py-2 text-sm text-brand-primary-dark">{message}</p> : null}
              {error ? <p className="rounded-md border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error-text">{error}</p> : null}

              <button
                type="submit"
                disabled={!product || submitting}
                className="h-12 rounded-lg bg-brand-primary px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Membuat order..." : authToken ? (paymentMethod === "midtrans_snap" ? "Bayar via Midtrans" : "Buat Order Manual") : "Login untuk Checkout"}
              </button>
              {!authToken ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link onClick={rememberCheckout} href="/login" className="rounded-md border border-brand-border-strong px-3 py-2 text-center text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong">
                    Login
                  </Link>
                  <Link onClick={rememberCheckout} href="/register" className="rounded-md border border-brand-border-strong px-3 py-2 text-center text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong">
                    Register
                  </Link>
                </div>
              ) : null}
            </form>
          )}
        </aside>
      </section>
    </main>
  );
}

function subscribeToAuthToken(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getAuthTokenSnapshot() {
  return localStorage.getItem("growtrack_token");
}

function getServerAuthTokenSnapshot() {
  return null;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-3">
      <p className="text-xs font-semibold text-brand-primary-dark">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
