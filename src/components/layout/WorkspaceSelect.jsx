"use client";

import { useEffect } from "react";
import { Store } from "lucide-react";

import { getMyWorkspaces } from "@/api/workspaces";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function WorkspaceSelect() {
  const { workspaces, activeWorkspaceId, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();

  useEffect(() => {
    if (workspaces.length > 0) return;
    let cancel = false;
    (async () => {
      try {
        const list = await getMyWorkspaces();
        if (cancel) return;
        if (list?.length) {
          setWorkspaces(list);
        } else {
          setWorkspaces([]);
        }
      } catch (e) {
        if (!cancel) {
          toast.error(e instanceof Error ? e.message : "Could not load workspaces");
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [workspaces.length, setWorkspaces]);

  if (workspaces.length === 0) {
    return (
      <div className="hidden text-xs text-amber-700 sm:flex sm:items-center sm:gap-1.5 sm:rounded-md sm:border sm:border-amber-500/30 sm:bg-amber-500/10 sm:px-2 sm:py-1">
        <Store className="size-3.5 shrink-0" />
        <span>No workspace</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-[200px] items-center gap-1.5 sm:max-w-xs">
      <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <Select
        value={activeWorkspaceId != null ? String(activeWorkspaceId) : undefined}
        onValueChange={(v) => setActiveWorkspaceId(Number(v))}
      >
        <SelectTrigger className="h-8 text-xs sm:text-sm">
          <SelectValue placeholder="Workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
