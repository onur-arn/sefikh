import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { removeFile } from "@/lib/storage";

async function ownItem(id: string) {
  const user = await getCurrentUser();
  if (!user?.company) return null;
  return db.portfolioImage.findFirst({ where: { id, companyId: user.company.id } });
}

const patchSchema = z.object({
  title: z.string().trim().max(120).nullish(),
  description: z.string().trim().max(1000).nullish(),
  projectName: z.string().trim().max(120).nullish(),
  location: z.string().trim().max(120).nullish(),
  year: z.coerce.number().int().min(1900).max(2100).nullish().catch(null),
  move: z.enum(["up", "down", "first"]).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/portfolio/[id]">) {
  const { id } = await ctx.params;
  const item = await ownItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const { move, ...fields } = parsed.data;

  if (move) {
    const all = await db.portfolioImage.findMany({ where: { companyId: item.companyId }, orderBy: { position: "asc" }, select: { id: true } });
    const ids = all.map((a) => a.id);
    const i = ids.indexOf(id);
    ids.splice(i, 1);
    const target = move === "first" ? 0 : move === "up" ? Math.max(0, i - 1) : Math.min(ids.length, i + 1);
    ids.splice(target, 0, id);
    await db.$transaction(ids.map((pid, position) => db.portfolioImage.update({ where: { id: pid }, data: { position } })));
  } else {
    await db.portfolioImage.update({ where: { id }, data: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v === "" ? null : v])) });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, ctx: RouteContext<"/api/portfolio/[id]">) {
  const { id } = await ctx.params;
  const item = await ownItem(id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.portfolioImage.delete({ where: { id } });
  await Promise.all([removeFile(item.key), removeFile(item.thumbKey)]);
  const left = await db.portfolioImage.count({ where: { companyId: item.companyId } });
  if (left === 0) await db.company.update({ where: { id: item.companyId }, data: { published: false } });
  return NextResponse.json({ ok: true });
}
