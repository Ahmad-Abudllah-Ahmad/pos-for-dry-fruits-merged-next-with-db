import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * @typedef {{ id: number; name: string; description: string | null; created_by_id: number; created_at: string }} Workspace
 */

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      /** @type {Workspace[]} */
      workspaces: [],
      /** @type {number | null} */
      activeWorkspaceId: null,

      /** @param {Workspace[]} list */
      setWorkspaces: (list) => {
        const { activeWorkspaceId: cur } = get();
        const next = list.find((w) => w.id === cur) ? cur : list[0]?.id ?? null;
        set({ workspaces: list, activeWorkspaceId: next });
      },
      /** @param {number | null} id */
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      clear: () => set({ workspaces: [], activeWorkspaceId: null }),
    }),
    {
      name: "pos-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeWorkspaceId: s.activeWorkspaceId }),
    }
  )
);
