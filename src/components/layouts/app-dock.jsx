"use client";

import { BarChart3, Home, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils/cn";

/**
 * Bottom dock (post-login shell) — quick nav, not a sidebar.
 */
export function AppDock({ className = "" }) {
  const path = usePathname();
  const user = useAuthStore((s) => s.user);
  const admin = isAdminUser(user);

  const items = [];
  if (admin) {
    items.push({ href: "/admin", label: "Admin", icon: Users });
  }
  items.push(
    { href: "/app", label: "Stock", icon: Home },
    { href: "/app/pos", label: "POS", icon: ShoppingCart },
    { href: "/analytics", label: "Stats", icon: BarChart3 }
  );

  return (
    <div
      className={[
        "pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center p-3 pb-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="pointer-events-auto flex h-12 max-w-lg items-center justify-center gap-0.5 rounded-2xl border border-border bg-surface-dock px-2 shadow-md backdrop-blur-md sm:gap-1 sm:px-3"
        role="toolbar"
        aria-label="Quick actions"
      >
        {items.map((it) => {
            const active =
              it.href === "/app"
                ? path === "/app" || path === "/app/" || (path && path.startsWith("/app") && !path.startsWith("/app/pos"))
                : it.href === "/app/pos"
                  ? path === "/app/pos" || path?.startsWith("/app/pos/")
                  : path === it.href;
            const Icon = it.icon;
            return (
              <Link
                key={it.href + it.label}
                href={it.href}
                className={cn(
                  "flex min-w-10 flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-medium sm:text-xs",
                  active
                    ? "text-foreground bg-elevated shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{it.label}</span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
