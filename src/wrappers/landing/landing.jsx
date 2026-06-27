import Link from "next/link";
import {
  ArrowRight,
  Scale,
  Package,
  BookOpen,
  Printer,
  Warehouse,
  TrendingUp,
  Cpu,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/common/button";
import { DefaultLayout } from "@/components/layouts";

export function LandingPage() {
  const features = [
    {
      icon: <Scale className="size-6 text-amber-700" />,
      urduTitle: "الیکٹرانک اسکیل انٹیگریشن",
      title: "Weighing Scale Integration",
      desc: "Direct digital scale connectivity for real-time weight reading (kg/g) during loose billing of premium almonds, pistachios, and raw spices.",
    },
    {
      icon: <Package className="size-6 text-amber-700" />,
      urduTitle: "بیچ اور ماخذ کی ٹریکنگ",
      title: "Batch & Origin Tracking",
      desc: "Log product details by origin (e.g., Afghani Fig, Irani Pistachio) alongside bag sizes, moisture parameters, and packaging metrics.",
    },
    {
      icon: <BookOpen className="size-6 text-amber-700" />,
      urduTitle: "کھاتا لیجر اور کسٹمر بیلنس",
      title: "Double-Entry Ledger & Khaata",
      desc: "Manage whole-seller and regular customer balances with a robust digital ledger system, tracking credits, payments, and histories.",
    },
    {
      icon: <Printer className="size-6 text-amber-700" />,
      urduTitle: "فوری بلنگ اور تھرمل پرنٹنگ",
      title: "Instant Thermal Invoicing",
      desc: "Generate professional multilingual billing receipts optimized for 80mm/58mm thermal printers with custom headers and discount rules.",
    },
    {
      icon: <Warehouse className="size-6 text-amber-700" />,
      urduTitle: "گودام اور کاؤنٹر مینجمنٹ",
      title: "Multi-Warehouse Control",
      desc: "Monitor live stock levels across bulk storage godowns and retail outlets, coordinating transfers with smart auto-approvals.",
    },
    {
      icon: <TrendingUp className="size-6 text-amber-700" />,
      urduTitle: "کاروباری کارکردگی اور منافع",
      title: "Live Profit Analytics",
      desc: "Identify best-selling products, track batch profitability, and review high-fidelity financial charts in real-time.",
    },
  ];

  return (
    <DefaultLayout>
      <div className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-[400px] rounded-full bg-amber-500/10 blur-3xl sm:size-[600px]" />
        <div className="pointer-events-none absolute bottom-0 left-10 -z-10 size-[300px] rounded-full bg-emerald-500/5 blur-3xl sm:size-[500px]" />

        <div className="mx-auto max-w-5xl space-y-16">
          <section className="mx-auto max-w-3xl space-y-6 px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/50 px-3.5 py-1 text-xs font-medium text-amber-800 shadow-sm backdrop-blur-sm sm:text-sm">
              <Sparkles className="size-3.5 animate-pulse text-amber-600" />
              <span>Premium Enterprise Retail Solution</span>
            </div>

            <div className="space-y-4">
              <h1 className="select-none text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                <span
                  className="Urdu-Brand-Header mb-4 block font-sans text-accent text-amber-700 drop-shadow-sm leading-normal"
                  style={{ direction: "rtl" }}
                >
                  الروحانی ڈرائی فروٹ اینڈ مرچ مصالحہ جات
                </span>
                <span className="block font-[family:var(--font-outfit),system-ui,sans-serif] text-2xl font-semibold tracking-normal text-stone-800 sm:text-3xl lg:text-4xl">
                  Al Rohani Dry Fruit &amp; Mirch Masala Jat
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                A custom-engineered, ultra-fast POS &amp; Inventory ecosystem meticulously tailored for premium wholesale dry fruit operations, customized packaging counters, and high-frequency spices retailing.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link href="/auth" className="inline-flex items-center gap-2">
                  <span>Access POS Console | لاگ ان کریں</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="px-4">
            <div className="rounded-2xl border border-amber-200/50 bg-white/70 p-4 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3 px-2">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="rounded-md bg-stone-100/80 px-12 py-0.5 font-mono text-2xs tracking-wider text-stone-400">
                  alrohani-pos.local/console
                </div>
                <div className="size-4 rounded bg-stone-100" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="space-y-4 rounded-xl border border-stone-200/60 bg-white p-4 md:col-span-8">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-semibold text-stone-700">Counter Ticket #0843</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-3xs font-medium text-emerald-800">
                      Weighing Scale: Connected
                    </span>
                  </div>

                  <div className="space-y-2 text-2xs">
                    <div className="grid grid-cols-12 border-b border-stone-100 pb-1 font-semibold text-stone-500">
                      <div className="col-span-6">Item Description</div>
                      <div className="col-span-2 text-right">Weight/Qty</div>
                      <div className="col-span-2 text-right">Rate/kg</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>

                    <div className="grid grid-cols-12 py-1 font-medium text-stone-700">
                      <div className="col-span-6 text-stone-800">
                        Kashmiri Almonds (Premium Almonds - بادام لذیذ)
                      </div>
                      <div className="col-span-2 text-right font-mono text-amber-700">4.850 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 2,400</div>
                      <div className="col-span-2 text-right font-mono font-semibold text-stone-900">
                        Rs. 11,640
                      </div>
                    </div>

                    <div className="grid grid-cols-12 py-1 font-medium text-stone-700">
                      <div className="col-span-6 text-stone-800">
                        Sabz Elaichi 7.5mm (Green Cardamom - الائچی سبز)
                      </div>
                      <div className="col-span-2 text-right font-mono text-amber-700">0.750 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 4,800</div>
                      <div className="col-span-2 text-right font-mono font-semibold text-stone-900">
                        Rs. 3,600
                      </div>
                    </div>

                    <div className="grid grid-cols-12 border-b border-stone-100 pb-2 py-1 font-medium text-stone-700">
                      <div className="col-span-6 text-stone-800">
                        Irani Akbari Pistachio (پستہ اکبری ایرانی)
                      </div>
                      <div className="col-span-2 text-right font-mono text-amber-700">2.120 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 3,800</div>
                      <div className="col-span-2 text-right font-mono font-semibold text-stone-900">
                        Rs. 8,056
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/50 p-2.5">
                    <span className="text-2xs text-stone-500">
                      Gross Weight: <strong className="text-stone-700">7.720 kg</strong>
                    </span>
                    <div className="text-right">
                      <span className="block text-3xs font-semibold uppercase tracking-wider text-stone-400">
                        Total Amount Due
                      </span>
                      <span className="font-mono text-base font-bold text-amber-800">Rs. 23,296</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 md:col-span-4">
                  <div className="space-y-3.5 rounded-xl border border-stone-200/60 bg-white p-4">
                    <span className="block border-b border-stone-100 pb-2 text-xs font-semibold text-stone-700">
                      Quick Commands
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-3xs font-medium">
                      <div className="cursor-default select-none rounded border border-amber-200 bg-amber-50/40 p-2 text-center text-amber-800">
                        F1: Read Weight
                      </div>
                      <div className="cursor-default select-none rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700">
                        F2: Select Khaata
                      </div>
                      <div className="cursor-default select-none rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700">
                        F5: Print Bill
                      </div>
                      <div className="cursor-default select-none rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700">
                        F9: Hold Sale
                      </div>
                    </div>
                    <div className="cursor-default select-none rounded-lg bg-amber-700 py-2 text-center text-xs font-semibold text-amber-100 shadow-sm">
                      Instant Cash Checkout (F12)
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5">
                    <div>
                      <span className="block text-3xs font-semibold uppercase tracking-wider text-emerald-700">
                        Today&apos;s Ledger Cashflow
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-800">Rs. 184,300</span>
                    </div>
                    <div className="rounded-full bg-emerald-100/70 p-1.5">
                      <TrendingUp className="size-4 text-emerald-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8 px-4" style={{ direction: "rtl" }}>
            <div className="space-y-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/50 px-3.5 py-1 text-xs font-semibold text-amber-800">
                مرکزی کنٹرول سسٹمز
              </span>
              <h2 className="text-2xl font-extrabold leading-snug tracking-tight text-stone-800 sm:text-3xl">
                ہمارے پاس تین خصوصی سسٹم اور ڈیش بورڈز دستیاب ہیں
              </h2>
              <p className="mx-auto max-w-xl text-xs leading-relaxed text-stone-500 sm:text-sm">
                الروحانی ڈرائی فروٹ اینڈ مرچ مصالحہ جات کے کاروبار کو منظم کرنے کے لیے سمارٹ انٹیگریٹڈ پینلز کا حسین امتزاج۔
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 text-right md:grid-cols-3">
              <div className="rounded-2xl border-r-4 border-r-amber-700 border border-amber-200/50 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="ml-auto mb-4 w-fit rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Scale className="size-6" />
                </div>
                <h3 className="mb-2 font-[family:var(--font-outfit),system-ui,sans-serif] text-base font-bold text-stone-800">
                  1. پی او ایس سیلز کاؤنٹر ڈیش بورڈ
                </h3>
                <p className="text-xs leading-relaxed font-sans text-stone-500">
                  تیز رفتار ریٹیل بلنگ، ڈیجیٹل اسکیل سے لائیو وزن ریڈنگ، کسٹمر ہولڈ بلنگ اور تھرمل بل پرنٹنگ کے لیے مخصوص سمارٹ سیلز کاؤنٹر۔
                </p>
              </div>

              <div className="rounded-2xl border-r-4 border-r-stone-700 border border-stone-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="ml-auto mb-4 w-fit rounded-xl bg-stone-100 p-3 text-stone-700">
                  <Cpu className="size-6" />
                </div>
                <h3 className="mb-2 font-[family:var(--font-outfit),system-ui,sans-serif] text-base font-bold text-stone-800">
                  2. انتظامی ایڈمن ڈیش بورڈ
                </h3>
                <p className="text-xs leading-relaxed font-sans text-stone-500">
                  مکمل دکان کی نگرانی، ملازمین کے کنٹرول، کھاتا لیجر اور کسٹمر اکاؤنٹس، نفع و نقصان کی تفصیلی رپورٹس، اور انتظامی سیٹنگز پینل۔
                </p>
              </div>

              <div className="rounded-2xl border-r-4 border-r-emerald-700 border border-emerald-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="ml-auto mb-4 w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <Warehouse className="size-6" />
                </div>
                <h3 className="mb-2 font-[family:var(--font-outfit),system-ui,sans-serif] text-base font-bold text-stone-800">
                  3. گودام اور اسٹاک ڈیش بورڈ
                </h3>
                <p className="text-xs leading-relaxed font-sans text-stone-500">
                  گودام میں بلک انوینٹری کی آمد، دکان کے کاؤنٹرز پر مال کی منتقلی، اور اسٹاک کی بیچ وائز اور ایکسپائری لائف ٹریکنگ۔
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-8 px-4">
            <div className="space-y-2 text-center">
              <h2 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-2xl font-bold text-stone-800 sm:text-3xl">
                Specially Configured Dry Fruit &amp; Mirch Masala Jat Features
              </h2>
              <p className="mx-auto max-w-xl text-sm text-stone-500 sm:text-base">
                No generic storefront workflows here. Every feature has been polished to reflect specialized spice wholesale and dry fruit logistics.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                >
                  <div className="mb-4 w-fit rounded-xl bg-amber-50 p-3 transition-all group-hover:bg-amber-100/80">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <span
                      className="block text-sm font-semibold leading-relaxed tracking-wide text-amber-700/85 font-sans"
                      style={{ direction: "rtl", textAlign: "right" }}
                    >
                      {f.urduTitle}
                    </span>
                    <h3 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-base font-bold text-stone-800">
                      {f.title}
                    </h3>
                    <p className="pt-1 text-xs leading-relaxed text-stone-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative mx-4 overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -bottom-10 -right-10 -z-10 size-[200px] rounded-full bg-stone-50" />
            <div className="pointer-events-none absolute left-6 top-4 -z-10 select-none font-mono text-9xl font-bold text-stone-100">
              &lt;/&gt;
            </div>

            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 rounded bg-stone-100 px-2.5 py-1 font-mono text-2xs text-stone-600">
                  <Cpu className="size-3.5" />
                  <span>Lead Developer Profile</span>
                </div>

                <h3 className="font-[family:var(--font-outfit),system-ui,sans-serif] text-xl font-bold text-stone-800 sm:text-2xl">
                  Software Developed by Umair
                </h3>

                <p className="text-xs leading-relaxed text-stone-600 sm:text-sm">
                  This custom-tailored point of sale (POS) and inventory ecosystem is fully designed and developed by <strong>Umair</strong>. Meticulously optimized for high-performance dry fruit bulk trading, integrated weighing scale communications, offline-resilient sales ticketing, and advanced dual accounting ledger (Khaata) layers.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-stone-700 sm:text-sm">
                    <span className="font-semibold text-stone-500">Developer Email:</span>
                    <a href="mailto:umairdev89@gmail.com" className="font-medium text-amber-800 hover:underline">
                      umairdev89@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-700 sm:text-sm">
                    <span className="font-semibold text-stone-500">Contact Number:</span>
                    <a href="tel:03400728009" className="font-mono font-semibold text-amber-800 hover:underline">
                      03400728009
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-l border-stone-200/80 pl-0 lg:col-span-5 lg:pl-8">
                <div className="space-y-1">
                  <span className="text-3xs font-semibold uppercase tracking-wider text-stone-400">
                    Engineering Service Inquiries
                  </span>
                  <p className="font-[family:var(--font-outfit),system-ui,sans-serif] text-sm font-bold text-stone-800">
                    Custom Enterprise Dev
                  </p>
                  <p className="text-xs leading-relaxed text-stone-500">
                    Need custom high-end business systems, localized wholesale databases, hardware printer configurations, or weighing scale integrations? Get in touch directly.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-3xs text-stone-600">
                  <span className="rounded border border-stone-200/40 bg-stone-100 px-2 py-0.5">React 19</span>
                  <span className="rounded border border-stone-200/40 bg-stone-100 px-2 py-0.5">Next.js 16</span>
                  <span className="rounded border border-stone-200/40 bg-stone-100 px-2 py-0.5">FastAPI</span>
                  <span className="rounded border border-stone-200/40 bg-stone-100 px-2 py-0.5">PostgreSQL</span>
                  <span className="rounded border border-stone-200/40 bg-stone-100 px-2 py-0.5">Weighing APIs</span>
                </div>

                <div className="border-t border-stone-100 pt-3">
                  <p className="text-3xs font-medium text-stone-400">
                    Software Engineered by Umair. All Rights Reserved. Custom Tailored for Al Rohani Dry Fruit.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DefaultLayout>
  );
}
