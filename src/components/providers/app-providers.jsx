"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        expand
        visibleToasts={5}
        position="top-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border border-border bg-elevated text-foreground shadow-[0_22px_55px_rgba(28,25,23,0.16)]",
            title: "text-sm font-semibold",
            description: "text-sm text-muted-foreground",
            actionButton: "bg-accent text-accent-foreground",
            cancelButton: "bg-muted text-foreground",
            closeButton: "border-border bg-elevated text-muted-foreground",
          },
        }}
      />
    </>
  );
}
