"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type Interview = {
  id: number;
  target_role: string;
  status: "ongoing" | "completed";
  score: number | null;
  feedback: string | null;
};

export default function MockInterviewChat() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInterview() {
      const token = localStorage.getItem("growtrack_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
      
      try {
        const response = await fetch(`${baseUrl}/mock-interviews/${params.id}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setInterview(data.interview);
          setMessages(data.messages);
        } else {
          setError("Gagal memuat sesi interview.");
        }
      } catch {
        setError("Backend belum bisa dihubungi.");
      } finally {
        setLoading(false);
      }
    }

    loadInterview();
  }, [params.id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = localStorage.getItem("growtrack_token");
    if (!token || !interview || interview.status === "completed") return;

    const form = new FormData(e.currentTarget);
    const content = form.get("message") as string;
    
    if (!content.trim()) return;

    setSubmitting(true);
    
    // Optimistic UI update for user message
    const tempUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);
    
    const formElement = e.currentTarget;
    formElement.reset();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/mock-interviews/${interview.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.new_message]);
      } else {
        alert("Gagal mengirim pesan.");
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id)); // rollback
      }
    } catch {
      alert("Error menghubungi server.");
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id)); // rollback
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinish() {
    if (!confirm("Akhiri sesi interview ini dan dapatkan feedback?")) return;

    const token = localStorage.getItem("growtrack_token");
    if (!token || !interview) return;

    setFinishing(true);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

    try {
      const response = await fetch(`${baseUrl}/mock-interviews/${interview.id}/finish`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      } else {
        alert("Gagal mengakhiri interview.");
      }
    } catch {
      alert("Error menghubungi server.");
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-brand-muted">Memuat...</div>;
  }

  if (error || !interview) {
    return <div className="p-8 text-center text-status-error-text">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-brand-surface py-5 text-brand-text">
      <div className="mx-auto flex h-[calc(100vh-40px)] max-w-4xl flex-col rounded-lg border border-brand-border bg-white shadow-sm">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-brand-border p-4">
          <div>
            <Link href="/dashboard/mock-interview" className="text-sm font-semibold text-brand-primary-dark hover:underline">
              &larr; Kembali
            </Link>
            <h1 className="mt-1 text-xl font-bold">Simulasi: {interview.target_role}</h1>
          </div>
          {interview.status === "ongoing" && (
            <button
              onClick={handleFinish}
              disabled={finishing || submitting}
              className="rounded-md bg-status-error-bg px-4 py-2 text-sm font-semibold text-status-error-text transition hover:opacity-80 disabled:opacity-50"
            >
              {finishing ? "Menghitung Skor..." : "Akhiri & Minta Feedback"}
            </button>
          )}
        </header>

        {/* Results Area (If Completed) */}
        {interview.status === "completed" && (
          <div className="border-b border-brand-border bg-brand-surface-strong p-6">
            <h2 className="text-lg font-bold">Hasil Interview</h2>
            <div className="mt-4 flex items-start gap-6">
              <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-full bg-brand-primary-dark text-white">
                <span className="text-2xl font-black">{interview.score ?? 0}</span>
                <span className="text-[10px] uppercase">Skor</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Feedback AI:</p>
                <div className="mt-2 max-w-none text-sm leading-6 text-brand-muted">
                  {(interview.feedback ?? "Tidak ada feedback.").split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    isUser 
                      ? "bg-brand-primary-dark text-white rounded-tr-none" 
                      : "bg-brand-surface text-brand-text rounded-tl-none border border-brand-border"
                  }`}>
                    <div className="text-sm leading-6">
                      {msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                    <span className={`mt-2 block text-[10px] ${isUser ? "text-brand-surface-glow opacity-80" : "text-brand-muted"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {submitting && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg rounded-tl-none border border-brand-border bg-brand-surface px-4 py-3 text-brand-muted">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-brand-primary-dark"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-brand-primary-dark [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-brand-primary-dark [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {interview.status === "ongoing" && (
          <div className="border-t border-brand-border p-4">
            <form onSubmit={handleReply} className="flex items-end gap-3">
              <textarea
                name="message"
                required
                rows={2}
                placeholder="Ketik jawaban Anda..."
                className="flex-1 resize-none rounded-md border border-brand-border-strong px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-[52px] rounded-md bg-brand-primary px-6 font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
              >
                Kirim
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-brand-muted">Tekan Enter untuk mengirim, Shift+Enter untuk baris baru.</p>
          </div>
        )}
      </div>
    </main>
  );
}
