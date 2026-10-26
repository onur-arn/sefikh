"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { deleteProject, setProjectStatus } from "@/app/(app)/dashboard/projects/actions";
import { Button } from "@/components/ui/button";

export function ProjectActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="secondary" loading={pending} onClick={() => start(() => setProjectStatus(id, status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"))}>
        {status === "ACTIVE" ? <Archive className="size-4" /> : <ArchiveRestore className="size-4" />}
        {status === "ACTIVE" ? "Archive" : "Reactivate"}
      </Button>
      <Button
        variant="ghost"
        aria-label="Delete project"
        onClick={() => {
          if (confirm("Delete this project? Conversations are kept but unlinked.")) start(() => deleteProject(id));
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
