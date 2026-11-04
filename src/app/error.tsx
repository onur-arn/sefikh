"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tr = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">{tr("Something went wrong")}</p>
      <h1 className="display mt-3 text-5xl">{tr("An unexpected error occurred.")}</h1>
      <p className="mt-3 max-w-md text-sm text-muted">{tr("Our team has been notified. Please try again in a moment.")}{error.digest && tr(" (ref. {digest})", { digest: error.digest })}</p>
      <Button onClick={reset} className="mt-8">
        {tr("Try again")}</Button>
    </div>
  );
}
