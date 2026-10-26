import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/misc";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <Link href="/" aria-label="SEFIKH — home" className="w-fit">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[420px] animate-fade-up">{children}</div>
        </main>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} SEFIKH ·{" "}
          <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/legal/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
        </p>
      </div>
      <aside className="grain relative hidden overflow-hidden bg-espresso lg:block">
        <Image src="/images/auth.webp" alt="Velvet armchair and burl wood cabinetry" fill priority sizes="50vw" className="object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/10 to-transparent" />
        <blockquote className="absolute bottom-14 left-14 right-14 z-10 text-paper">
          <p className="display text-4xl italic leading-tight">“The details are not the details. They make the design.”</p>
          <footer className="mt-4 text-xs uppercase tracking-[0.25em] text-paper/60">Charles Eames</footer>
        </blockquote>
      </aside>
    </div>
  );
}
