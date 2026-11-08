import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/utils";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const tr = await getT();
  return { title: tr("Account") };
}

/**
 * Porte d'entrée unique (lien « Compte » de l'en-tête) : se connecter et créer un compte ont le même poids.
 * Sur mobile, « Nouveau sur SEFIKH » passe en premier.
 */
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const tr = await getT();
  const { next } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : undefined);
  if (await getCurrentUser()) redirect(target);

  return (
    <div className="container-x py-12 sm:py-20">
      <p className="folio">{tr("Account")}</p>
      <div className="mt-8 grid border-t border-ink/70 lg:grid-cols-2">
        {/* Nouveau sur SEFIKH */}
        <section className="order-first border-b border-line py-10 lg:order-last lg:border-b-0 lg:border-l lg:py-14 lg:pl-14">
          <p className="eyebrow">{tr("New to SEFIKH?")}</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">{tr("Create an account")}</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft">{tr("3 free searches, no commitment.")}</p>
          <div className="mt-8 flex max-w-sm flex-col gap-3">
            <ButtonLink href="/register" size="lg" className="justify-between">
              {tr("I'm looking for a maker")} <ArrowRight className="size-3.5" />
            </ButtonLink>
            <ButtonLink href="/register?role=pro" variant="secondary" size="lg" className="justify-between">
              {tr("I am a maker")} <ArrowRight className="size-3.5" />
            </ButtonLink>
          </div>
        </section>

        {/* Déjà membre */}
        <section className="py-10 lg:py-14 lg:pr-14">
          <p className="eyebrow">{tr("Already a member?")}</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">{tr("Log in")}</h1>
          <div className="max-w-sm">
            <LoginForm next={target} showSignup={false} />
          </div>
        </section>
      </div>
    </div>
  );
}
