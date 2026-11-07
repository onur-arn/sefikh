"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Send, Share2, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { toggleSaveAction } from "@/app/(site)/makers/actions";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";

type Viewer = { loggedIn: boolean; role: string | null; verified: boolean; canSave: boolean } ;

export function SaveButton({ companyId, initialSaved, viewer }: { companyId: string; initialSaved: boolean; viewer: Viewer }) {
  const tr = useT();
  const [saved, setSaved] = useState(initialSaved);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (viewer.role === "PRO") return null;
  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!viewer.loggedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
          start(async () => {
            const r = await toggleSaveAction(companyId);
            if (r.error) setMsg(r.error);
            else setSaved(!!r.saved);
          });
        }}
        disabled={pending}
        aria-pressed={saved}
        className={cn("inline-flex h-11 items-center gap-2 rounded-sm border px-5 text-sm transition", saved ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/50")}
      >
        {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        {saved ? tr("Saved") : tr("Save")}
      </button>
      {msg && (
        <div className="absolute right-0 top-13 z-10 w-64 rounded-xl border border-line bg-paper p-4 text-sm shadow-lg">
          <p>{tr(msg)}</p>
          <Link href="/subscription" className="mt-2 inline-block font-medium text-brass-dark underline">
            {tr("See plans")}</Link>
        </div>
      )}
    </div>
  );
}

export function ShareButton({ name }: { name: string }) {
  const tr = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = location.href.split("?")[0]!;
        if (navigator.share) await navigator.share({ title: `${name} on SEFIKH`, url }).catch(() => {});
        else {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      }}
      className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-paper hover:border-ink/50"
      aria-label={tr("Share this profile")}
      title={copied ? tr("Link copied") : tr("Share")}
    >
      <Share2 className="size-4" />
    </button>
  );
}

export function ContactButton({ company, viewer, projects, className }: { company: { id: string; name: string; slug: string }; viewer: Viewer; projects: { id: string; title: string }[]; className?: string }) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (viewer.role === "PRO") return null;
  if (!viewer.loggedIn)
    return (
      <ButtonLink href={`/login?next=/makers/${company.slug}`} size="lg" className={className}>
        {tr("Connect with the company")}</ButtonLink>
    );

  function send() {
    setError(null);
    if (body.trim().length < 10) return setError({ text: tr("Please introduce your project in a few sentences.") });
    start(async () => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, projectId: projectId || null, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError({ text: data.error ?? "Something went wrong.", upgrade: data.code === "LIMIT" });
      router.push(`/messages?c=${data.id}`);
    });
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)} className={className}>
        {tr("Connect with the company")}</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={tr("Contact {name}", { name: company.name })}>
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-lg animate-fade-up rounded-t-3xl bg-paper p-6 sm:rounded-3xl sm:p-8">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full hover:bg-sand" aria-label={tr("Close")}>
              <X className="size-4" />
            </button>
            <p className="eyebrow">{tr("New conversation")}</p>
            <h2 className="display mt-2 text-3xl">{tr("Write to {name}", { name: company.name })}</h2>
            {!viewer.verified ? (
              <div className="mt-6 rounded-xl bg-brass-light/50 p-4 text-sm">
                {tr("Please confirm your e-mail address before contacting makers. Check your inbox, or resend the link from your")}{" "}
                <Link href="/dashboard" className="font-medium underline">
                  {tr("dashboard")}</Link>
                .
              </div>
            ) : (
              <>
                {projects.length > 0 && (
                  <label className="mt-6 block">
                    <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">{tr("Related project")}</span>
                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="field">
                      <option value="">{tr("General enquiry")}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {tr(p.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">{tr("Your message")}</span>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={5000} placeholder={tr("Introduce yourself and your project: what you need, quantities, location, timeline, budget…")} className="field resize-none" autoFocus />
                </label>
                {error && (
                  <p className="mt-3 text-sm text-danger" role="alert">
                    {tr(error.text)}
                    {error.upgrade && (
                      <Link href="/subscription" className="font-medium underline">
                        {tr("Upgrade")}</Link>
                    )}
                  </p>
                )}
                <Button onClick={send} loading={pending} className="mt-6 w-full" size="lg">
                  <Send className="size-4" /> {" "}{tr("Send message")}</Button>
                <p className="mt-3 text-center text-[12px] text-muted">{tr("The maker will be notified by e-mail.")}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
