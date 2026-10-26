import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ARTICLES } from "@/lib/journal";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal", description: "Materials, techniques, trends and guides from the SEFIKH editorial team." };

export default function JournalPage() {
  const [first, ...rest] = ARTICLES;
  return (
    <div className="container-x py-14">
      <p className="eyebrow">Journal</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">Stories of materials & makers.</h1>
      <Link href={`/journal/${first!.slug}`} className="group mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem]">
          <Image src={first!.image} alt="" fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        </div>
        <div>
          <p className="eyebrow">{first!.category} · {formatDate(first!.date)}</p>
          <h2 className="display mt-3 text-4xl group-hover:underline sm:text-5xl">{first!.title}</h2>
          <p className="mt-4 text-muted">{first!.excerpt}</p>
        </div>
      </Link>
      <div className="mt-16 grid gap-10 md:grid-cols-2">
        {rest.map((a) => (
          <Link key={a.slug} href={`/journal/${a.slug}`} className="group">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem]">
              <Image src={a.image} alt="" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
            </div>
            <p className="eyebrow mt-5">{a.category} · {a.readingTime} min read</p>
            <h2 className="display mt-2 text-3xl group-hover:underline">{a.title}</h2>
            <p className="mt-2 text-sm text-muted">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
