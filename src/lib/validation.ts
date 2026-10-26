import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid e-mail address.").max(160);

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["CLIENT", "PRO"]),
  terms: z.literal("on", { message: "Please accept the terms to continue." }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password."),
});

export const resetSchema = z
  .object({ token: z.string().min(10), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string[] | undefined> } | null;

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

/** Lit un FormData en objet simple ; les clés répétées (cases à cocher) deviennent des tableaux. */
export function formToObject(fd: FormData, arrayKeys: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    const values = fd.getAll(key).filter((v) => typeof v === "string") as string[];
    out[key] = arrayKeys.includes(key) ? values.map((v) => v.trim()).filter(Boolean) : values[0];
  }
  for (const k of arrayKeys) out[k] ??= [];
  return out;
}
