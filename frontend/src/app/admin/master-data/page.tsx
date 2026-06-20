"use client";

import {
  AdminShell,
  AssessmentForm,
  CareerGoalForm,
  FormCard,
  LoadingAdmin,
  RoadmapForm,
  SectionHeader,
  SkillForm,
  useAdminData,
} from "../AdminShared";

export default function MasterDataPage() {
  const { data, message, error, loading, loadData, submit } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Master data untuk career development."
      eyebrow="Master Data"
      body="Kelola data dasar yang dipakai oleh register, dashboard, assessment, dan roadmap."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Master Data"
        title="Fondasi sistem"
        body="Isi data dari atas ke bawah agar konfigurasi berikutnya punya sumber data yang lengkap."
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <FormCard title="Career Goal" description="Buat jalur seperti promosi, specialist track, atau job readiness.">
          <CareerGoalForm onSubmit={(payload) => submit("/admin/career-goals", payload)} />
        </FormCard>

        <FormCard title="Skill" description="Masukkan skill yang akan dinilai dalam assessment.">
          <SkillForm onSubmit={(payload) => submit("/admin/skills", payload)} />
        </FormCard>

        <FormCard title="Assessment Template" description="Tentukan template assessment untuk employee atau fresh graduate.">
          <AssessmentForm onSubmit={(payload) => submit("/admin/assessment-templates", payload)} />
        </FormCard>

        <FormCard title="Roadmap Module" description="Tambahkan modul belajar atau project untuk setiap career goal.">
          <RoadmapForm
            goals={data.career_goals}
            onSubmit={(payload) => submit("/admin/roadmap-modules", payload)}
          />
        </FormCard>
      </div>
    </AdminShell>
  );
}
