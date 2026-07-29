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
        body="Course memakai link materi, webinar memakai jadwal, kuota, dan link meeting. Produk inactive tidak muncul di checkout publik."
      />

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
              <h2 className="mt-2 text-xl font-semibold">Produk Aktif dan Inactive</h2>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Edit data produk dari sini. Delete hanya aman untuk produk yang belum punya order.
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
              data.learning_products.map((product) => (
                <article key={product.id} className="rounded-lg border border-brand-border bg-brand-panel-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary-dark">
                        {product.type} - {product.category}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">{product.title}</h3>
                      <p className="mt-1 text-sm text-brand-muted">/{product.slug}</p>
                      <p className="mt-2 text-sm font-semibold text-brand-text">{formatRupiah(product.price)}</p>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">{product.outcome}</p>
                    </div>
                    <div className="grid min-w-36 gap-2">
                      <span className={`rounded-md px-3 py-2 text-center text-sm font-semibold ${product.status === "active" ? "bg-brand-surface-strong text-brand-primary-dark" : "bg-status-warning-bg text-status-warning-text"}`}>
                        {product.status}
                      </span>
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
              ))
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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
