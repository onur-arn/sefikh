import { redirect } from "next/navigation";

/** Ancienne adresse de connexion : la page « Compte » réunit connexion et inscription. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") params.set(k, v);
  redirect(`/account${params.size ? `?${params}` : ""}`);
}
