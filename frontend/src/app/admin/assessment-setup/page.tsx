"use client";

import {
  AdminShell,
  AssessmentQuestionForm,
  FormCard,
  LoadingAdmin,
  PreviewList,
  SectionHeader,
  SkillTargetForm,
  useAdminData,
} from "../AdminShared";

export default function AssessmentSetupPage() {
  const { data, message, error, loading, loadData, submit } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Atur target skill dan pertanyaan assessment."
      eyebrow="Assessment Setup"
      body="Konfigurasi ini menentukan cara sistem menghitung skill gap user setelah assessment disubmit."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Assessment Setup"
        title="Target skill dan pertanyaan"
        body="Hubungkan career goal dengan skill target, lalu buat pertanyaan yang menilai skill tersebut."
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <FormCard title="Target Skill per Career Goal" description="Tentukan target score skill untuk setiap career goal.">
          <SkillTargetForm
            goals={data.career_goals}
            skills={data.skills}
            onSubmit={(payload) => submit("/admin/skill-targets", payload)}
          />
        </FormCard>

        <FormCard title="Assessment Question" description="Buat pertanyaan dan hubungkan ke skill agar scoring otomatis berjalan.">
          <AssessmentQuestionForm
            templates={data.assessment_templates}
            skills={data.skills}
            onSubmit={(payload) => submit("/admin/assessment-questions", payload)}
          />
        </FormCard>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <PreviewList
          title="Skill targets"
          items={data.skill_targets.map((target) => `${target.career_goal} - ${target.skill}: ${target.target_score}`)}
          empty="Belum ada target skill."
        />
        <PreviewList
          title="Questions"
          items={data.assessment_questions.map(
            (question) => `${question.assessment_template} - ${question.skill}: ${question.question}`,
          )}
          empty="Belum ada pertanyaan assessment."
        />
      </section>
    </AdminShell>
  );
}
