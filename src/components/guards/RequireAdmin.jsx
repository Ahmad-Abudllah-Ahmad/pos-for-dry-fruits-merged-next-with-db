"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";

export function RequireAdmin({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setReady(true);
  }, []);

  const ok = isAdminUser(user);

  useEffect(() => {
    if (!ready || !user) return;
    if (!ok) {
      router.replace("/app/pos");
    }
  }, [ready, user, ok, router]);

  if (!ready) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!ok) {
    return null;
  }

  return children;
}
