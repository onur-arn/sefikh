"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/validation";

/**
 * Variante de useActionState qui soumet via onSubmit : contrairement à `<form action>`,
 * React ne réinitialise pas les champs, l'utilisateur garde sa saisie en cas d'erreur.
 */
export function useFormAction(action: (state: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
