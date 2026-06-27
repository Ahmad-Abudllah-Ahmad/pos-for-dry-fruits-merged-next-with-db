"use client";

import { LogIn, LogOut } from "lucide-react";
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
        "sticky top-0 z-50 flex h-16 shrink-0 items-center border-b border-amber-200/20 px-4 backdrop-blur-md shadow-[0_2px_12px_rgba(180,83,9,0.03)]",
        "bg-white/95 text-foreground transition-all duration-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:px-2 2xl:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={authed ? (admin ? "/admin" : "/app/pos") : "/"}
            className="font-[family:var(--font-outfit),system-ui,sans-serif] shrink-0 flex items-center gap-2 text-base font-bold tracking-tight select-none"
          >
            <span className="bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 px-2.5 py-1 rounded-md text-xs tracking-wide uppercase font-extrabold shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
              Al Rohani
            </span>
            <span className="text-stone-800 font-bold hidden xs:inline tracking-tight">POS</span>
            <span className="text-stone-400 font-semibold hidden sm:inline text-xs">
              | الروحانی ڈرائی فروٹ
            </span>
          </Link>
          {mode === "app" && <WorkspaceSelect />}
        </div>

        <nav className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {mode === "public" && (
            <>
              <Link className={link} data-active={isActive("/auth")} href="/auth">
                <span className="inline-flex items-center gap-1.5">
                  <LogIn className="size-3.5" />
                  <span className="hidden sm:inline">Sign in</span>
                </span>
              </Link>
            </>
          )}

          {mode === "app" && authed && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 shadow-2xs font-semibold text-xs transition-all duration-300 active:scale-[0.98]"
                onClick={() => {
                  clearSession();
                  useWorkspaceStore.getState().clear();
                  router.push("/");
                  router.refresh();
                }}
              >
                <LogOut className="size-3.5 text-amber-800" />
                <span>Logout / لاگ آؤٹ</span>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
