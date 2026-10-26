"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setPublished } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";

export function PublishToggle({ published }: { published: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-col items-end">
      <Button
        variant={published ? "secondary" : "brass"}
        loading={pending}
        onClick={() =>
          start(async () => {
            const r = await setPublished(!published);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
      >
        {published ? "Unpublish" : "Publish my profile"}
      </Button>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
