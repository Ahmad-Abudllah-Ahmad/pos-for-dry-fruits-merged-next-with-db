"use client";

import { BarChart3, Boxes, Home, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils/cn";

/**
 * Bottom dock (post-login shell) — quick nav, styled like a premium macOS floating dock.
 */
export function AppDock({ className = "" }) {
  const path = usePathname();
  const user = useAuthStore((s) => s.user);
  const admin = isAdminUser(user);

  const items = [];
  if (admin) {
    items.push({ href: "/admin", label: "Admin", icon: Users });
    items.push({ href: "/admin/items", label: "Items", icon: Boxes });
  }
  items.push(
    { href: "/app", label: "Stock", icon: Home },
    { href: "/app/pos", label: "POS", icon: ShoppingCart },
    { href: "/analytics", label: "Analytics", icon: BarChart3 }
  );

  return (
    <div
      className={[
        "pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pb-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="pointer-events-auto flex h-18 items-center justify-center gap-1.5 rounded-3xl border border-white/60 bg-white/80 px-4 shadow-[0_20px_50px_rgba(28,25,23,0.12)] backdrop-blur-xl sm:gap-2 sm:px-6 transition-all duration-300"
        role="toolbar"
        aria-label="Quick actions"
      >
        {items.map((it) => {
          const active =
            it.href === "/app"
              ? path === "/app" || path === "/app/" || (path && path.startsWith("/app") && !path.startsWith("/app/pos"))
              : it.href === "/app/pos"
                ? path === "/app/pos" || path?.startsWith("/app/pos/")
                : it.href === "/admin"
                  ? path === "/admin" || path === "/admin/"
                  : path === it.href || path?.startsWith(`${it.href}/`);
          const Icon = it.icon;
          return (
            <Link
              key={it.href + it.label}
              href={it.href}
              className={cn(
                "relative flex h-14 w-14 sm:w-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold tracking-tight transition-all duration-300",
                "hover:scale-115 hover:-translate-y-2 hover:shadow-md active:scale-95",
                active
                  ? "text-amber-800 bg-amber-50/70 border border-amber-200/50 shadow-2xs"
                  : "text-stone-500 hover:bg-stone-50/80 hover:text-stone-850"
              )}
            >
              <Icon className={cn("size-5 transition-transform duration-300", active ? "scale-105 text-amber-700" : "text-stone-500")} />
              <span className="text-[10px] sm:text-2xs font-semibold">{it.label}</span>
              
              {/* macOS Active App Dot Indicator */}
              {active && (
                <span className="absolute bottom-1 size-1 rounded-full bg-amber-700 shadow-[0_0_6px_#d97706] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
