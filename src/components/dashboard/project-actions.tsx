"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { deleteProject, setProjectStatus } from "@/app/(app)/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export function ProjectActions({ id, status }: { id: string; status: string }) {
  const tr = useT();
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="secondary" loading={pending} onClick={() => start(() => setProjectStatus(id, status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"))}>
        {status === "ACTIVE" ? <Archive className="size-4" /> : <ArchiveRestore className="size-4" />}
        {status === "ACTIVE" ? tr("Archive") : tr("Reactivate")}
      </Button>
      <Button
        variant="ghost"
        aria-label={tr("Delete project")}
        onClick={() => {
          if (confirm(tr("Delete this project? Conversations are kept but unlinked."))) start(() => deleteProject(id));
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
