"use client";

import { useState } from "react";
import {
  AdminShell,
  FormCard,
  LoadingAdmin,
  ProductForm,
  SectionHeader,
  type AdminData,
  useAdminData,
} from "../AdminShared";

type Product = AdminData["learning_products"][number];

export default function AdminProductsPage() {
  const { data, message, error, loading, loadData } = useAdminData();
  const [localMessage, setLocalMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
  const activeProducts = data.learning_products.filter((product) => product.status === "active");
  const draftProducts = data.learning_products.filter((product) => product.status === "draft");
  const inactiveProducts = data.learning_products.filter((product) => product.status === "inactive");
  const publishReadyProducts = data.learning_products.filter((product) => publishWarnings(product).length === 0);
  const manualPaymentReady = Boolean(data.settings.manual_payment_instructions?.trim());
  const checkoutReady = activeProducts.length > 0 && manualPaymentReady;

  async function saveProduct(payload: Record<string, unknown>) {
    const token = localStorage.getItem("growtrack_token");
    const endpoint = editingProduct ? `/admin/products/${editingProduct.id}` : "/admin/products";

    setLocalMessage("");
    setLocalError("");

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: editingProduct ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setLocalError(result.message ?? "Produk gagal disimpan.");
        return;
      }

      setLocalMessage(result.message ?? "Produk berhasil disimpan.");
      setEditingProduct(null);
      await loadData();
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
    }
  }

  async function deleteProduct(product: Product) {
    const token = localStorage.getItem("growtrack_token");

    setLocalMessage("");
    setLocalError("");

    try {
      const response = await fetch(`${baseUrl}/admin/products/${product.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        setLocalError(result.message ?? "Produk gagal dihapus.");
        return;
      }

      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
      }

      setLocalMessage(result.message ?? "Produk berhasil dihapus.");
      await loadData();
    } catch {
      setLocalError("Backend belum bisa dihubungi.");
    }
  }

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Kelola produk course dan webinar."
      eyebrow="Product Admin"
      body="Buat etalase produk yang dipakai katalog publik, checkout, dan akses belajar user setelah pembayaran aktif."
      data={data}
      message={message || localMessage}
      error={error || localError}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Commerce"
        title="Produk pembelajaran"
        body="Produk draft bisa disiapkan tanpa tampil di publik. Hanya produk active yang muncul di katalog dan checkout."
      />

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <ProductMetric label="Active" value={activeProducts.length} body="Tampil di katalog publik." />
        <ProductMetric label="Draft" value={draftProducts.length} body="Masih disiapkan admin." />
        <ProductMetric label="Inactive" value={inactiveProducts.length} body="Disembunyikan tapi riwayat aman." />
      </section>

      <section className="mt-4 rounded-lg border border-brand-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Checkout Readiness</p>
            <h2 className="mt-2 text-xl font-semibold">{checkoutReady ? "Checkout siap dites" : "Checkout belum siap dites"}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Butuh minimal 1 produk active dan instruksi pembayaran manual agar user bisa membuat order tanpa mentok.
            </p>
          </div>
          <span className={`rounded-md px-3 py-2 text-sm font-semibold ${checkoutReady ? "bg-brand-primary-dark text-white" : "bg-status-warning-bg text-status-warning-text"}`}>
            {checkoutReady ? "Ready" : "Need setup"}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ReadinessItem ready={activeProducts.length > 0} title="Produk active" body={`${activeProducts.length} produk tampil publik`} href="/#assessment" action="Lihat katalog" />
          <ReadinessItem ready={manualPaymentReady} title="Instruksi pembayaran" body={manualPaymentReady ? "Manual transfer sudah diisi" : "Isi dari Admin Settings"} href="/admin/settings" action="Buka Settings" />
          <ReadinessItem ready={publishReadyProducts.length > 0} title="Siap publish" body={`${publishReadyProducts.length} produk memenuhi syarat publish`} href="/admin/products" action="Cek Produk" />
        </div>
      </section>

      <div className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <FormCard
          title={editingProduct ? `Edit ${editingProduct.title}` : "Tambah Produk"}
          description={editingProduct ? "Simpan perubahan untuk produk yang dipilih." : "Buat course atau webinar baru untuk katalog."}
        >
          {editingProduct ? (
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="mb-4 h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
            >
              Batal edit
            </button>
          ) : null}
          <ProductForm key={editingProduct?.id ?? "new"} product={editingProduct} onSubmit={saveProduct} />
        </FormCard>

        <section className="animate-card-in rounded-lg border border-brand-border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">Product List</p>
              <h2 className="mt-2 text-xl font-semibold">Produk Draft, Active, dan Inactive</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Publish produk saat konten, harga, dan link sudah siap. Delete hanya aman untuk produk yang belum punya order.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {data.learning_products.length ? (
              data.learning_products.map((product) => {
                const warnings = publishWarnings(product);
                const readyToPublish = warnings.length === 0;

                return (
                <article key={product.id} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                  {warnings.length ? (
                    <div className="mb-4 rounded-md border border-status-warning-border bg-status-warning-bg px-3 py-2 text-sm text-status-warning-text">
                      <p className="font-semibold">Belum siap publish</p>
                      <ul className="mt-1 list-disc pl-5 leading-6">
                        {warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                        {product.type} - {product.category}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">{product.title}</h3>
                      <p className="mt-1 text-sm text-brand-muted">/{product.slug}</p>
                      <p className="mt-2 text-sm font-semibold text-brand-text">{formatRupiah(product.price)}</p>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">{product.outcome}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ProductBadge ready={readyToPublish} label={readyToPublish ? "Konten siap publish" : "Konten belum lengkap"} />
                        <ProductBadge ready={product.status === "active"} label={product.status === "active" ? "Muncul di katalog" : "Belum tampil publik"} />
                        <ProductBadge ready={manualPaymentReady} label={manualPaymentReady ? "Payment siap" : "Payment belum siap"} />
                      </div>
                      {product.status === "active" ? (
                        <a
                          href={`/checkout/${product.slug}`}
                          className="mt-4 inline-flex h-10 items-center rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white"
                        >
                          Tes Checkout
                        </a>
                      ) : null}
                    </div>
                    <div className="grid w-full gap-2 sm:w-[150px]">
                      <span className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${statusClassName(product.status)}`}>
                        {product.status}
                      </span>
                      {product.status !== "active" ? (
                        <button
                          type="button"
                          onClick={() => saveProduct({ ...product, status: "active" })}
                          disabled={!readyToPublish}
                          className="h-10 rounded-md bg-brand-primary px-3 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Publish
                        </button>
                      ) : null}
                      {product.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => saveProduct({ ...product, status: "draft" })}
                          className="h-10 rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-brand-surface-strong"
                        >
                          Unpublish
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="h-10 rounded-md bg-brand-primary-dark px-3 text-sm font-semibold text-white hover:bg-brand-primary-deep"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        className="h-10 rounded-md border border-status-error-border px-3 text-sm font-semibold text-status-error-text hover:bg-status-error-bg"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
                );
              })
            ) : (
              <p className="rounded-md bg-brand-surface px-3 py-2 text-sm text-brand-muted">
                Belum ada produk. Tambahkan course atau webinar pertama dari form.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function ReadinessItem({ ready, title, body, href, action }: { ready: boolean; title: string; body: string; href: string; action: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-brand-muted">{body}</p>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${ready ? "bg-brand-primary-dark text-white" : "bg-status-warning-bg text-status-warning-text"}`}>
          {ready ? "OK" : "Setup"}
        </span>
      </div>
      <a
        href={href}
        className="mt-4 inline-flex h-10 items-center rounded-md border border-brand-border-strong px-3 text-sm font-semibold text-brand-primary-dark hover:bg-white"
      >
        {action}
      </a>
    </div>
  );
}

function ProductBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${ready ? "bg-brand-surface-strong text-brand-primary-dark" : "bg-status-warning-bg text-status-warning-text"}`}>
      {label}
    </span>
  );
}

function ProductMetric({ label, value, body }: { label: string; value: number; body: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-brand-primary-dark">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm leading-5 text-brand-muted">{body}</p>
    </div>
  );
}

function statusClassName(status: Product["status"]) {
  if (status === "active") {
    return "bg-brand-surface-strong text-brand-primary-dark";
  }

  if (status === "draft") {
    return "bg-status-warning-bg text-status-warning-text";
  }

  return "bg-brand-surface text-brand-muted";
}

function publishWarnings(product: Product) {
  const warnings: string[] = [];

  if (product.type === "course") {
    if (product.lesson_count < 1) {
      warnings.push("Course butuh minimal 1 lesson.");
    }

    if (!product.material_url) {
      warnings.push("Course butuh link materi sebelum active.");
    }
  }

  if (product.type === "webinar") {
    if (!product.scheduled_at) {
      warnings.push("Webinar butuh jadwal.");
    }

    if (!product.meeting_url) {
      warnings.push("Webinar butuh link meeting.");
    }

    if (!product.seat_limit || product.seat_limit < 1) {
      warnings.push("Webinar butuh kuota minimal 1 seat.");
    }
  }

  return warnings;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
