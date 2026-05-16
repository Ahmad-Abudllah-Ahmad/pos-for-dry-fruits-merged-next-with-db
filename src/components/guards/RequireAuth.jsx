"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireAuth({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || accessToken) return;
    const next = encodeURIComponent(path || "/app");
    router.replace(`/auth?view=login&next=${next}`);
  }, [ready, accessToken, router, path]);

  if (!ready) {
    return (
      <div className="p-6 space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return children;
}
