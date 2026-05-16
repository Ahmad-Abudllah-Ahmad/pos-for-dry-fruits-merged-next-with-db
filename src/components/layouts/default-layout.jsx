import { AppNav } from "./app-nav";

/**
 * Public / marketing shell: navbar + scrollable main (no dock).
 */
export function DefaultLayout({ children, className = "" }) {
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
      <AppNav mode="public" />
      <main className="mx-auto w-full max-w-6xl flex-1 flex-col px-4 py-6">
        {children}
      </main>
    </div>
  );
}
