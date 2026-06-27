import { Auth, authViews } from "@/components/auth";
import { DefaultLayout } from "@/components/layouts";

const VALID = new Set(Object.values(authViews));

/**
 * Route wrapper: public shell + auth parent. Pass `view` (e.g. from ?view=).
 * (Named `src/wrappers` because Next.js reserves `src/pages` for the legacy Pages Router.)
 * @param {{ view?: "login" | "signup" | "forgot-password" | "bootstrap" }} [props]
 */
export function AuthPage({ view = authViews.login }) {
  const safe = VALID.has(view) ? view : authViews.login;

  return (
    <DefaultLayout>
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full items-center justify-center py-4 md:py-8">
        <Auth view={safe} />
      </div>
    </DefaultLayout>
  );
}
