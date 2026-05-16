import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/common/button";
import { DefaultLayout } from "@/components/layouts";

/**
 * Public landing: default (navbar) shell; content in components when you build UI.
 */
export function LandingPage() {
  return (
    <DefaultLayout>
      <section className="max-w-2xl space-y-6 py-4">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif] sm:text-4xl">
            POS &amp; inventory
          </h1>
          <p className="text-lg text-muted-foreground">
            Dry-fruit style warehouse, shop, billing, and analytics — wired to your FastAPI backend
            (JWT, workspaces, ledger).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/auth" className="inline-flex items-center gap-2">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth?view=bootstrap" className="text-muted-foreground">
              First-time setup
            </Link>
          </Button>
        </div>
      </section>
    </DefaultLayout>
  );
}
