"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, Lock, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

import { login } from "@/api/auth";
import { getMyWorkspaces } from "@/api/workspaces";
import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/common/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/api/client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login({ phone_number: phone.trim(), password });
      const token = res.access_token;
      const user = res.user;
      if (!token || !user) {
        toast.error("Invalid response from server");
        return;
      }
      setSession(token, user);
      try {
        const w = await getMyWorkspaces();
        if (w?.length) {
          setWorkspaces(w);
        } else {
          setWorkspaces([]);
        }
      } catch {
        setWorkspaces([]);
      }
      const next = search.get("next");
      const defaultDest = isAdminUser(user) ? "/admin" : "/app/pos";
      const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : defaultDest;
      router.push(dest);
      router.refresh();
      toast.success("Welcome back");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative grid min-h-[620px] w-full overflow-hidden rounded-[32px] border border-amber-100 bg-white/95 shadow-[0_30px_90px_rgba(120,53,15,0.14)] backdrop-blur-sm md:grid-cols-12 lg:min-h-[680px]">
      <div className="pointer-events-none absolute -top-24 -right-16 size-[260px] rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 size-[220px] rounded-full bg-orange-100/80 blur-3xl" />

      <div className="relative hidden overflow-hidden bg-stone-950 px-8 py-10 text-stone-100 md:col-span-5 md:flex md:flex-col md:justify-between lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-amber-300/0 via-amber-300/25 to-amber-300/0" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-3xs font-medium uppercase tracking-[0.28em] text-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Sparkles className="size-3 text-amber-400" />
            <span>Secure System Console</span>
          </div>

          <div className="space-y-3">
            <span className="block text-3xl font-bold leading-relaxed text-amber-400 lg:text-[2.2rem]" style={{ direction: "rtl" }}>
              الروحانی ڈرائی فروٹ اینڈ مرچ مصالحہ جات
            </span>
            <span className="block font-[family:var(--font-outfit),system-ui,sans-serif] text-base font-medium tracking-tight text-stone-200">
              Al Rohani Dry Fruit &amp; Mirch Masala Jat
            </span>
            <p className="max-w-xs text-sm leading-6 text-stone-400">
              Trusted retail operations with secure access, faster checkout, and organized branch workflows.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-5 py-8 text-right" style={{ direction: "rtl" }}>
          <span className="block border-b border-stone-800 pb-2 text-right text-3xs font-bold uppercase tracking-[0.3em] text-amber-400">
            سسٹم میں دستیاب تین ڈیش بورڈز:
          </span>

          <div className="space-y-4 text-4xs leading-relaxed text-stone-300">
            <div className="space-y-1.5 rounded-2xl border border-stone-800/80 bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
              <strong className="block text-[11px] font-semibold text-stone-100">1. پی او ایس سیلز کاؤنٹر پینل</strong>
              <span className="text-stone-400">ریٹیل سیلز، ڈیجیٹل اسکیل وزن اور فوری بلنگ کے لیے۔</span>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-stone-800/80 bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
              <strong className="block text-[11px] font-semibold text-stone-100">2. مرکزی انتظامی ایڈمن پینل</strong>
              <span className="text-stone-400">اکاؤنٹس، کسٹمر لیجر (کھاتا) اور نفع نقصان رپورٹس کے لیے۔</span>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-stone-800/80 bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
              <strong className="block text-[11px] font-semibold text-stone-100">3. گودام اور اسٹاک کنٹرول پینل</strong>
              <span className="text-stone-400">انوینٹری کی آمد، منتقلی اور بیچ ایکسپائری ٹریکنگ کے لیے۔</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-3 border-t border-stone-800/90 pt-5">
          <div className="space-y-1.5 text-3xs">
            <span className="block font-bold uppercase tracking-[0.28em] text-stone-400">Developed by Umair</span>
            <span className="block font-sans font-medium text-stone-300">
              ای میل: <a href="mailto:umairdev89@gmail.com" className="text-amber-400 hover:underline">umairdev89@gmail.com</a>
            </span>
            <span className="block font-sans font-medium text-stone-300">
              رابطہ نمبر: <a href="tel:03400728009" className="text-amber-400 font-mono hover:underline">03400728009</a>
            </span>
          </div>
          <p className="border-t border-stone-800/60 pt-3 font-sans text-[10px] leading-normal text-stone-500">
            ڈویلپر سے کسی بھی مدد، نئی خصوصیات کے اضافے یا انٹیگریشن کے لیے براہِ راست رابطہ کریں۔
          </p>
        </div>
      </div>

      <div className="col-span-1 flex flex-col justify-center bg-gradient-to-br from-white via-white to-amber-50/35 p-6 sm:p-10 md:col-span-7 lg:p-14">
        <div className="mx-auto flex w-full max-w-[29rem] flex-col gap-8">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
              <ShieldCheck className="size-3.5" />
              <span>Operator Sign In</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                خوش آمدید | Welcome Back
              </h2>
              <p className="max-w-md text-sm leading-7 text-stone-500 sm:text-[15px]">
                Please enter your registered counter credentials to launch the POS dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="phone" className="text-sm font-semibold text-stone-700">
                Phone Number
              </Label>
              <div className="relative flex items-center">
                <Phone className="pointer-events-none absolute left-4 size-4 text-stone-400/80" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="username"
                  required
                  placeholder="e.g., 03001234567"
                  className="h-12 rounded-2xl border-stone-200 bg-white pl-11 text-base shadow-[0_8px_24px_rgba(28,25,23,0.05)] transition-all focus-visible:border-amber-500 focus-visible:ring-amber-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-semibold text-stone-700">
                Security Password
              </Label>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-4 size-4 text-stone-400/80" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="********"
                  className="h-12 rounded-2xl border-stone-200 bg-white pl-11 text-base shadow-[0_8px_24px_rgba(28,25,23,0.05)] transition-all focus-visible:border-amber-500 focus-visible:ring-amber-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-3 h-12 w-full rounded-2xl bg-amber-700 text-base font-semibold text-amber-50 shadow-[0_16px_30px_rgba(180,83,9,0.28)] transition-all hover:scale-[1.01] hover:bg-amber-800 active:scale-[0.99]"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span>Launch POS Terminal</span>
              )}
            </Button>
          </form>

          <div className="mt-1 flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/90 p-4 shadow-[0_10px_30px_rgba(28,25,23,0.04)]">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="text-4xs leading-relaxed text-stone-500">
              <strong>System Notice:</strong> This terminal connects to a secure enterprise network. All transactions, invoice modifications, and ledger adjustals are cryptographically logged.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
