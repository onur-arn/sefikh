"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-5xl">An unexpected error occurred.</h1>
      <p className="mt-3 max-w-md text-sm text-muted">Our team has been notified. Please try again in a moment.{error.digest && ` (ref. ${error.digest})`}</p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </div>
  );
}
