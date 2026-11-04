import type { Metadata } from "next";
import { db } from "@/lib/db";
import { daysFromNow } from "@/lib/utils";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Administration"), robots: { index: false } };
}

export default async function AdminPage() {
  const tr = await getT();
  const since = daysFromNow(-30);
  const [creatives, makers, published, subscriptions, messages, searches, requests, revenue] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "PRO" } }),
    db.company.count({ where: { published: true } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.message.count({ where: { createdAt: { gte: since } } }),
    db.searchLog.count({ where: { createdAt: { gte: since } } }),
    db.contactRequest.count({ where: { createdAt: { gte: since } } }),
    db.subscription.aggregate({ where: { status: "ACTIVE" }, _sum: { amount: true } }),
  ]);
  const tiles = [
    [tr("Creatives"), tr.number(creatives)],
    [tr("Makers"), tr.number(makers)],
    [tr("Published profiles"), tr.number(published)],
    [tr("Active subscriptions"), tr.number(subscriptions)],
    [tr("Monthly recurring revenue"), tr.money(revenue._sum.amount ?? 0)],
    [tr("Messages · 30 days"), tr.number(messages)],
    [tr("Searches · 30 days"), tr.number(searches)],
    [tr("Contact requests · 30 days"), tr.number(requests)],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-[13px] text-muted">{label}</p>
          <p className="display mt-2 text-4xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
