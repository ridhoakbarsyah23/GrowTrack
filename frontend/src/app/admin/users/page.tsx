"use client";

import {
  AdminShell,
  FormCard,
  LoadingAdmin,
  SectionHeader,
  UserForm,
  useAdminData,
} from "../AdminShared";

export default function UsersPage() {
  const { data, message, error, loading, loadData, submit } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Kelola akun dan profile career."
      eyebrow="User Management"
      body="Buat akun internal secara manual. User publik tetap bisa register sendiri dari halaman register."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="User Management"
        title="Akun dan profile career"
        body="Gunakan halaman ini untuk membuat admin, HR, mentor, employee, atau fresh graduate."
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <FormCard title="User + Profile" description="Buat akun dan, jika perlu, langsung hubungkan dengan career goal.">
          <UserForm goals={data.career_goals} onSubmit={(payload) => submit("/admin/users", payload)} />
        </FormCard>

        <section className="rounded-lg border border-brand-border bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary-dark">
            Recent Users
          </p>
          <h2 className="mt-2 text-xl font-semibold">User yang sudah tersedia</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {data.users.length ? (
              data.users.slice(0, 12).map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-md bg-brand-surface px-3 py-2">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-brand-muted">{user.email}</p>
                  </div>
                  <span className="rounded-md bg-brand-surface-strong px-2 py-1 text-xs font-semibold text-brand-primary-dark">
                    {user.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-brand-surface px-3 py-2 text-brand-muted">Belum ada user.</p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
