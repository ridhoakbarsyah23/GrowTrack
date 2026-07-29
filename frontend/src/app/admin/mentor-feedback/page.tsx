"use client";

import {
  AdminShell,
  LoadingAdmin,
  SectionHeader,
  type AdminData,
  useAdminData,
} from "../AdminShared";
import { MentorFeedbackWorkspace } from "../../components/MentorFeedbackWorkspace";

export default function AdminMentorFeedbackPage() {
  const { data, message, error, loading, loadData } = useAdminData();

  if (loading) {
    return <LoadingAdmin />;
  }

  return (
    <AdminShell
      title="Kelola feedback mentor untuk readiness user."
      eyebrow="Mentor Feedback"
      body="Isi rekomendasi, score, dan catatan mentor. Score ini masuk ke 10% komponen readiness."
      data={data}
      message={message}
      error={error}
      onRefresh={loadData}
    >
      <SectionHeader
        eyebrow="Feedback Review"
        title="Rekomendasi dan catatan mentor"
        body="Pilih user profile, isi score 0-100, lalu simpan feedback. Feedback yang sudah ada bisa diedit atau dihapus."
      />
      <div className="mt-5">
        <MentorFeedbackWorkspace
          profiles={data.user_profiles}
          feedback={data.mentor_feedback}
          onChanged={loadData}
        />
      </div>
    </AdminShell>
  );
}

export type AdminMentorFeedbackData = AdminData["mentor_feedback"][number];
