import { AuthPage } from "@/wrappers/auth/auth";

export const metadata = {
  title: "Sign in | POS",
};

export default async function Page({ searchParams }) {
  const s = await searchParams;
  const raw = s?.view;
  const view = typeof raw === "string" ? raw : "login";
  return <AuthPage view={view} />;
}
