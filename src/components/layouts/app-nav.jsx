"use client";

import { BarChart3, LayoutGrid, LogIn, LogOut, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { isAdminUser } from "@/lib/roles";
import { Button } from "@/components/common/button";
import { WorkspaceSelect } from "@/components/layout/WorkspaceSelect";

/**
 * @param {{ mode?: "public" | "app"; className?: string }} props
 */
export function AppNav({ className = "", mode = "public" }) {
  const router = useRouter();
  const path = usePathname();
  const { user, clearSession, accessToken } = useAuthStore();
  const authed = !!accessToken;
  const admin = isAdminUser(user);

  const link =
    "rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground data-[active=true]:text-foreground data-[active=true]:bg-muted/60";

  const isActive = (p) => path === p;

  return (
    <header
      className={[
        "sticky top-0 z-50 flex h-14 shrink-0 items-center border-b border-border px-3 backdrop-blur-md",
        "bg-surface-nav text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:px-2 2xl:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={authed ? (admin ? "/admin" : "/app") : "/"}
            className="font-[family:var(--font-outfit),system-ui,sans-serif] shrink-0 text-lg font-semibold tracking-tight"
          >
            POS
          </Link>
          {mode === "app" && <WorkspaceSelect />}
        </div>

        <nav className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
          {mode === "public" && (
            <>
              <Link
                className={link}
                data-active={isActive("/auth")}
                href="/auth"
              >
                <span className="inline-flex items-center gap-1.5">
                  <LogIn className="size-3.5" />
                  <span className="hidden sm:inline">Sign in</span>
                </span>
              </Link>
            </>
          )}

          {mode === "app" && authed && (
            <>
              {admin && (
                <Link
                  className={link}
                  data-active={isActive("/admin")}
                  href="/admin"
                >
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </span>
                </Link>
              )}
              <Link
                className={link}
                data-active={isActive("/app")}
                href="/app"
              >
                <span className="inline-flex items-center gap-1">
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">Stock</span>
                </span>
              </Link>
              <Link
                className={link}
                data-active={isActive("/app/pos")}
                href="/app/pos"
              >
                <span className="inline-flex items-center gap-1">
                  <ShoppingCart className="size-3.5" />
                  <span className="hidden sm:inline">POS</span>
                </span>
              </Link>
              <Link
                className={link}
                data-active={isActive("/analytics")}
                href="/analytics"
              >
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="size-3.5" />
                  <span className="hidden sm:inline">Analytics</span>
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-muted-foreground"
                onClick={() => {
                  clearSession();
                  useWorkspaceStore.getState().clear();
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
