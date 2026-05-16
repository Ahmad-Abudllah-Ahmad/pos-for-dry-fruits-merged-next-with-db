"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
