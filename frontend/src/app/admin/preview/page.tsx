"use client";

import {
  AdminShell,
  LoadingAdmin,
  PreviewList,
  SectionHeader,
  useAdminData,
} from "../AdminShared";

export default function PreviewPage() {
  const { data, message, error, loading, loadData } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Preview data yang sudah tersimpan."
      eyebrow="Preview Data"
      body="Cek konfigurasi sebelum user register dan mengerjakan assessment."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Preview"
        title="Data konfigurasi Pathly AI"
        body="Pastikan career goal, target skill, pertanyaan, dan roadmap sudah lengkap."
      />
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <PreviewList
          title="Career goals"
          items={data.career_goals.map((goal) => `${goal.title} - ${goal.level} (${goal.audience})`)}
          empty="Belum ada career goal."
        />
        <PreviewList
          title="Skills"
          items={data.skills.map((skill) => `${skill.name} - ${skill.category}`)}
          empty="Belum ada skill."
        />
        <PreviewList
          title="Roadmap modules"
          items={data.roadmap_modules.map((module) => `${module.career_goal} - ${module.sequence}. ${module.title}`)}
          empty="Belum ada roadmap module."
        />
        <PreviewList
          title="Skill targets"
          items={data.skill_targets.map((target) => `${target.career_goal} - ${target.skill}: ${target.target_score}`)}
          empty="Belum ada target skill."
        />
        <PreviewList
          title="Assessment questions"
          items={data.assessment_questions.map(
            (question) => `${question.assessment_template} - ${question.skill}: ${question.question}`,
          )}
          empty="Belum ada pertanyaan assessment."
        />
        <PreviewList
          title="Users"
          items={data.users.map((user) => `${user.name} - ${user.email} (${user.role})`)}
          empty="Belum ada user."
        />
      </section>
    </AdminShell>
  );
}
