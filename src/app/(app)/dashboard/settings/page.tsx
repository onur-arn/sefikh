import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatRelative } from "@/lib/utils";
import { Card } from "@/components/ui/misc";
import { ChangeEmailForm, ChangePasswordForm, DeleteAccountForm, NotificationsForm, SignOutOthersButton } from "./forms";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

function describeAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` on ${os}` : ""}`;
}

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const sessions = await db.session.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastUsedAt: "desc" } });
  return (
    <>
      <header className="mb-8">
        <h1 className="display text-4xl sm:text-5xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">Account security, notifications and personal data.</p>
      </header>
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <h2 className="display text-2xl">E-mail address</h2>
          <p className="mt-1 text-sm text-muted">
            Current: <span className="text-ink">{user.email}</span> {user.emailVerifiedAt ? "· confirmed" : "· not confirmed"}
          </p>
          <ChangeEmailForm />
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="display text-2xl">Password</h2>
          <ChangePasswordForm />
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="display text-2xl">Notifications</h2>
          <NotificationsForm notifyByEmail={user.notifyByEmail} />
        </Card>
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl">Active sessions</h2>
            {sessions.length > 1 && <SignOutOthersButton />}
          </div>
          <ul className="mt-4 divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  {describeAgent(s.userAgent)}
                  {s.id === user.sessionId && <span className="ml-2 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">This device</span>}
                </span>
                <span className="text-[12px] text-muted">
                  {s.ip ? `${s.ip} · ` : ""}
                  {formatRelative(s.lastUsedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6 sm:p-8">
          <h2 className="display text-2xl">Your data</h2>
          <p className="mt-1 text-sm text-muted">Download a copy of your personal data (GDPR), in JSON format.</p>
          <a href="/api/me/export" className="mt-4 inline-flex h-10 items-center rounded-full border border-ink/70 px-5 text-sm hover:bg-ink hover:text-paper">
            Download my data
          </a>
        </Card>
        <Card className="border-danger/30 p-6 sm:p-8">
          <h2 className="display text-2xl text-danger">Delete my account</h2>
          <p className="mt-1 text-sm text-muted">This permanently deletes your profile, portfolio, projects, documents and conversations, and cancels any subscription. This cannot be undone.</p>
          <DeleteAccountForm />
        </Card>
      </div>
    </>
  );
}
