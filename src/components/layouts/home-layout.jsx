import { AppDock } from "./app-dock";
import { AppNav } from "./app-nav";

/**
 * In-app shell after login: top navbar + main + bottom dock.
 */
export function HomeLayout({ children, className = "" }) {
  return (
    <div
      className={[
        "flex min-h-svh flex-col font-sans text-foreground",
        "bg-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AppNav mode="app" />
      <main className="w-full flex-1 px-4 pb-[var(--t-dock-safe)] pt-6 sm:px-5 2xl:px-6">
        {children}
      </main>
      <AppDock />
    </div>
  );
}
