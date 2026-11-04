import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const tr = await getT();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/">
        <Logo />
      </Link>
      <p className="display mt-14 text-[8rem] leading-none text-brass">404</p>
      <h1 className="display mt-4 text-4xl">{tr("This page could not be found.")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted">{tr("The link may be broken or the page may have been removed. Let's get you back to the makers.")}</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">{tr("Home")}</ButtonLink>
        <ButtonLink href="/search" variant="secondary">
          {tr("Explore makers")}</ButtonLink>
      </div>
    </div>
  );
}
