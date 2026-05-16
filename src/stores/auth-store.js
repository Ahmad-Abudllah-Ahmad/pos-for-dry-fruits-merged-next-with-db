import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { isAdminUser } from "@/lib/roles";

/**
 * @typedef {{ id: number; name: string; role: string; phone_number?: string; cnic_number?: string }} User
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,

      /** @param {string} accessToken @param {User} user */
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
      /** @param {User} user */
      setUser: (user) => set({ user }),

      isAuthed: () => !!get().accessToken,
      isAdmin: () => isAdminUser(get().user),
    }),
    {
      name: "pos-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    }
  )
);
