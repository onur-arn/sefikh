import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/journal";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const a = getArticle((await params).slug);
  const tr = await getT();
  return a ? { title: tr(a.title), description: tr(a.excerpt), openGraph: { images: [a.image], type: "article" } } : {};
}

export default async function ArticlePage({ params }: PageProps<"/journal/[slug]">) {
  const tr = await getT();
  const a = getArticle((await params).slug);
  if (!a) notFound();
  return (
    <article className="container-x max-w-3xl py-14">
      <Link href="/journal" className="text-[13px] text-muted hover:text-ink">
        {tr("← Journal")}</Link>
      <p className="eyebrow mt-8">{tr(a.category)} · {tr.date(a.date)} · {tr("{readingTime} min read", { readingTime: a.readingTime })}</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">{tr(a.title)}</h1>
      <p className="mt-5 font-display text-2xl italic text-muted">{tr(a.excerpt)}</p>
      <div className="relative mt-10 aspect-[16/10] overflow-hidden">
        <Image src={a.image} alt="" fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
      </div>
      <div className="mt-10 space-y-5 text-[17px] leading-[1.8] text-ink-soft">
        {a.body.map((p, i) => (
          <p key={i}>{tr(p)}</p>
        ))}
      </div>
      <div className="mt-14 rounded-3xl bg-paper p-8 text-center">
        <p className="display text-3xl">{tr("Find the makers behind the story.")}</p>
        <ButtonLink href="/search" className="mt-5">
          {tr("Explore expertise")}</ButtonLink>
      </div>
    </article>
  );
}
