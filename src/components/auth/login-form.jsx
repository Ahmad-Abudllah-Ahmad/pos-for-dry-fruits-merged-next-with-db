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
    <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-200/40 bg-white shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
      
      {/* Decorative Warm Accent Ambient Glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 -z-10 size-[300px] rounded-full bg-amber-500/10 blur-3xl" />
      
      {/* Left Pane: Branding & Status (Hidden on mobile) */}
      <div className="hidden md:flex md:col-span-5 bg-stone-900 text-stone-100 p-6 flex-col justify-between relative overflow-hidden">
        {/* Soft background brand grid graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Top Header */}
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-3xs font-medium text-amber-400 uppercase tracking-widest">
            <Sparkles className="size-3 text-amber-400" />
            <span>Secure System Console</span>
          </div>
          
          <div className="space-y-1">
            <span className="block text-2xl font-bold font-sans text-amber-500 leading-relaxed" style={{ direction: "rtl" }}>
              الروحانی ڈرائی فروٹس اینڈ مصالحہ جات
            </span>
            <span className="block text-sm text-stone-300 font-[family:var(--font-outfit),system-ui,sans-serif] font-medium tracking-tight">
              Al Rohani Dry Fruits &amp; Spices
            </span>
          </div>
        </div>

        {/* Center POS Dashboard: 3 Urdu Dashboards info */}
        <div className="space-y-3.5 relative z-10 py-4 text-right" style={{ direction: "rtl" }}>
          <span className="text-3xs uppercase font-bold tracking-widest text-amber-500 block text-right border-b border-stone-800 pb-1.5">
            سسٹم میں دستیاب تین ڈیش بورڈز:
          </span>
          
          <div className="space-y-3 text-4xs leading-relaxed text-stone-300">
            <div className="space-y-0.5">
              <strong className="text-stone-100 block text-[11px] font-semibold">۱. پی او ایس سیلز کاؤنٹر پینل</strong>
              <span className="text-stone-400">ریٹیل سیلز، ڈیجیٹل اسکیل وزن اور فوری بلنگ کے لیے۔</span>
            </div>
            <div className="space-y-0.5">
              <strong className="text-stone-100 block text-[11px] font-semibold">۲. مرکزی انتظامی ایڈمن پینل</strong>
              <span className="text-stone-400">اکاؤنٹس، کسٹمر لیجر (کھاتہ) اور نفع نقصان رپورٹس کے لیے۔</span>
            </div>
            <div className="space-y-0.5">
              <strong className="text-stone-100 block text-[11px] font-semibold">۳. گودام اور اسٹاک کنٹرول پینل</strong>
              <span className="text-stone-400">انوینٹری کی آمد، منتقلی اور بیچ ایکسپائری ٹریکنگ کے لیے۔</span>
            </div>
          </div>
        </div>

        {/* Bottom footer: Developer Info */}
        <div className="space-y-2.5 relative z-10 border-t border-stone-800 pt-4">
          <div className="space-y-1 text-3xs">
            <span className="text-stone-400 uppercase tracking-widest block font-bold">Developed by Umair</span>
            <span className="text-stone-300 font-medium block font-sans">
              ای میل: <a href="mailto:umairdev89@gmail.com" className="text-amber-400 hover:underline">umairdev89@gmail.com</a>
            </span>
            <span className="text-stone-300 font-medium block font-sans">
              رابطہ نمبر: <a href="tel:03400728009" className="text-amber-400 font-mono hover:underline">03400728009</a>
            </span>
          </div>
          <p className="text-[10px] text-stone-500 leading-normal border-t border-stone-800/60 pt-2 font-sans">
            ڈویلپر سے کسی بھی مدد، نئی خصوصیات کے اضافے یا انٹیگریشن کے لیے براہِ راست رابطہ کریں۔
          </p>
        </div>
      </div>

      {/* Right Pane: Main Login Form */}
      <div className="col-span-1 md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
        <div className="space-y-6 max-w-sm w-full mx-auto">
          
          {/* Header Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif] tracking-tight">
              خوش آمدید | Welcome Back
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Please enter your registered counter credentials to launch the POS dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            
            {/* Phone Input */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-stone-700">
                Phone Number
              </Label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 size-4 text-stone-400/80 pointer-events-none" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="username"
                  required
                  placeholder="e.g., 03001234567"
                  className="pl-9 h-10 border-stone-200 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                Security Password
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-stone-400/80 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="pl-9 h-10 border-stone-200 focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] mt-2 bg-amber-700 hover:bg-amber-800 text-amber-100"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
                  <span>Verifying Credentials…</span>
                </span>
              ) : (
                <span>Launch POS Terminal</span>
              )}
            </Button>

          </form>

          {/* Secure Warning Label */}
          <div className="flex items-start gap-2 rounded-xl bg-stone-50 border border-stone-100 p-3 mt-4">
            <AlertCircle className="size-4 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-4xs text-stone-500 leading-normal">
              <strong>System Notice:</strong> This terminal connects to a secure enterprise network. All transactions, invoice modifications, and ledger adjustals are cryptographically logged.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
