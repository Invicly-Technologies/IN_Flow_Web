"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image src="/branding/flow_icon.png" alt="Invicly Flow" width={52} height={52} />
          <div className="text-[23px] font-extrabold tracking-tight text-text">
            Invicly <span className="bg-brand-flow bg-clip-text text-transparent">Flow</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-state-success" />
              <h1 className="mb-1 text-lg font-bold text-text">Message sent</h1>
              <p className="text-[13px] text-text-secondary">
                Thanks for reaching out — the Invicly team will get back to you soon.
              </p>
              <Link href="/login" className="mt-4 text-[13px] font-semibold text-brand-blue">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-bold text-text">Contact us</h1>
              <p className="mb-5 text-[13px] text-text-secondary">
                Questions, feedback, or need help with Invicly Flow? Send us a message.
              </p>
              <form onSubmit={submit} className="flex flex-col gap-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Email</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand-blue"
                  />
                </div>
                {error && <p className="text-xs text-state-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 rounded-[9px] bg-brand-flow px-3.5 py-2 text-[13.5px] font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
