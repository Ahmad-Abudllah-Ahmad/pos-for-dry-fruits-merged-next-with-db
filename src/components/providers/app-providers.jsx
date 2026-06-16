"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }) {
  return (
    <>
      {children}
      <Toaster
        theme="light"
        richColors
        expand
        closeButton
        visibleToasts={4}
        duration={4500}
        gap={10}
        position="top-center"
        offset={{
          top: "calc(4rem + 0.75rem)",
          right: "1rem",
          left: "1rem",
        }}
        mobileOffset={{
          top: "calc(4rem + 0.5rem)",
          right: "0.75rem",
          left: "0.75rem",
        }}
        toastOptions={{
          classNames: {
            toast:
              "rounded-xl border border-border bg-white text-foreground shadow-[0_12px_40px_rgba(28,25,23,0.14),0_2px_8px_rgba(28,25,23,0.06)] font-sans",
            title: "text-sm font-semibold leading-snug",
            description: "text-sm leading-snug",
            actionButton: "bg-accent text-accent-foreground",
            cancelButton: "bg-muted text-foreground",
            closeButton:
              "border-stone-200/80 bg-white/95 text-stone-500 hover:bg-white hover:text-stone-800",
            success:
              "border-emerald-200 bg-emerald-50 text-emerald-950 [&_[data-description]]:text-emerald-800/90",
            error:
              "border-red-200 bg-red-50 text-red-950 [&_[data-description]]:text-red-800/90",
            warning:
              "border-amber-200 bg-amber-50 text-amber-950 [&_[data-description]]:text-amber-800/90",
            info: "border-sky-200 bg-sky-50 text-sky-950 [&_[data-description]]:text-sky-800/90",
          },
        }}
      />
    </>
  );
}
