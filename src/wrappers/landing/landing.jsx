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
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/common/button";
import { DefaultLayout } from "@/components/layouts";

export function LandingPage() {
  const features = [
    {
      icon: <Scale className="size-6 text-amber-700" />,
      urduTitle: "الیکٹرانک اسکیل انٹیگریشن",
      title: "Weighing Scale Integration",
      desc: "Direct digital scale connectivity for real-time weight reading (kg/g) during loose billing of premium almonds, pistachios, and raw spices."
    },
    {
      icon: <Package className="size-6 text-amber-700" />,
      urduTitle: "بیچ اور ماخذ کی ٹریکنگ",
      title: "Batch & Origin Tracking",
      desc: "Log product details by origin (e.g., Afghani Fig, Irani Pistachio) alongside bag sizes, moisture parameters, and packaging metrics."
    },
    {
      icon: <BookOpen className="size-6 text-amber-700" />,
      urduTitle: "کھاتہ لیجر اور کسٹمر بیلنس",
      title: "Double-Entry Ledger & Khaata",
      desc: "Manage whole-seller and regular customer balances with a robust digital ledger system, tracking credits, payments, and histories."
    },
    {
      icon: <Printer className="size-6 text-amber-700" />,
      urduTitle: "فوری بلنگ اور تھرمل پرنٹنگ",
      title: "Instant Thermal Invoicing",
      desc: "Generate professional multilingual billing receipts optimized for 80mm/58mm thermal printers with custom headers and discount rules."
    },
    {
      icon: <Warehouse className="size-6 text-amber-700" />,
      urduTitle: "گودام اور کاؤنٹر مینجمنٹ",
      title: "Multi-Warehouse Control",
      desc: "Monitor live stock levels across bulk storage godowns and retail outlets, coordinating transfers with smart auto-approvals."
    },
    {
      icon: <TrendingUp className="size-6 text-amber-700" />,
      urduTitle: "کاروباری کارکردگی اور منافع",
      title: "Live Profit Analytics",
      desc: "Identify best-selling products, track batch profitability, and review high-fidelity financial charts in real-time."
    }
  ];

  return (
    <DefaultLayout>
      <div className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        {/* Soft elegant warm accent glows */}
        <div className="pointer-events-none absolute -top-40 right-0 -z-10 size-[400px] rounded-full bg-amber-500/10 blur-3xl sm:size-[600px]" />
        <div className="pointer-events-none absolute bottom-0 left-10 -z-10 size-[300px] rounded-full bg-emerald-500/5 blur-3xl sm:size-[500px]" />

        <div className="mx-auto max-w-5xl space-y-16">
          
          {/* Brand Hero Segment */}
          <section className="text-center space-y-6 max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/50 px-3.5 py-1 text-xs sm:text-sm font-medium text-amber-800 shadow-sm backdrop-blur-sm">
              <Sparkles className="size-3.5 text-amber-600 animate-pulse" />
              <span>Premium Enterprise Retail Solution</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight leading-tight select-none">
                <span className="block font-sans text-accent text-amber-700 drop-shadow-sm mb-4 leading-normal Urdu-Brand-Header" style={{ direction: "rtl" }}>
                  الروحانی ڈرائی فروٹس اینڈ مصالحہ جات
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif] tracking-normal font-semibold">
                  Al Rohani Dry Fruits &amp; Masalajat
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
                A custom-engineered, ultra-fast POS &amp; Inventory ecosystem meticulously tailored for premium wholesale dry fruit operations, customized packaging counters, and high-frequency spices retailing.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Link href="/auth" className="inline-flex items-center gap-2">
                  <span>Access POS Console | لاگ ان کریں</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          {/* Interactive CSS Mockup Section */}
          <section className="px-4">
            <div className="rounded-2xl border border-amber-200/50 bg-white/70 p-4 shadow-xl backdrop-blur-md">
              {/* Browser bar top */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 px-2">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-400" />
                  <div className="size-3 rounded-full bg-yellow-400" />
                  <div className="size-3 rounded-full bg-green-400" />
                </div>
                <div className="rounded-md bg-stone-100/80 px-12 py-0.5 text-2xs text-stone-400 font-mono tracking-wider">
                  alrohani-pos.local/console
                </div>
                <div className="size-4 rounded bg-stone-100" />
              </div>
              
              {/* Mockup POS Interface Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Billing details pane mockup */}
                <div className="md:col-span-8 border border-stone-200/60 rounded-xl bg-white p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                    <span className="text-xs font-semibold text-stone-700">Counter Ticket #0843</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-3xs font-medium text-emerald-800">Weighing Scale: Connected</span>
                  </div>
                  
                  {/* Table mockup */}
                  <div className="space-y-2 text-2xs">
                    <div className="grid grid-cols-12 font-semibold text-stone-500 border-b border-stone-100 pb-1">
                      <div className="col-span-6">Item Description</div>
                      <div className="col-span-2 text-right">Weight/Qty</div>
                      <div className="col-span-2 text-right">Rate/kg</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    
                    <div className="grid grid-cols-12 text-stone-700 font-medium py-1">
                      <div className="col-span-6 text-stone-800">Kashmiri Almonds (Premium Almonds - بادام لذیذ)</div>
                      <div className="col-span-2 text-right font-mono text-amber-700">4.850 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 2,400</div>
                      <div className="col-span-2 text-right font-mono text-stone-900 font-semibold">Rs. 11,640</div>
                    </div>
                    
                    <div className="grid grid-cols-12 text-stone-700 font-medium py-1">
                      <div className="col-span-6 text-stone-800">Sabz Elaichi 7.5mm (Green Cardamom - الائچی سبز)</div>
                      <div className="col-span-2 text-right font-mono text-amber-700">0.750 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 4,800</div>
                      <div className="col-span-2 text-right font-mono text-stone-900 font-semibold">Rs. 3,600</div>
                    </div>
                    
                    <div className="grid grid-cols-12 text-stone-700 font-medium py-1 border-b border-stone-100 pb-2">
                      <div className="col-span-6 text-stone-800">Irani Akbari Pistachio (پستہ اکبری ایرانی)</div>
                      <div className="col-span-2 text-right font-mono text-amber-700">2.120 kg</div>
                      <div className="col-span-2 text-right font-mono">Rs. 3,800</div>
                      <div className="col-span-2 text-right font-mono text-stone-900 font-semibold">Rs. 8,056</div>
                    </div>
                  </div>
                  
                  {/* Totals panel mockup */}
                  <div className="flex justify-between items-center bg-stone-50/50 p-2.5 rounded-lg border border-stone-100">
                    <span className="text-2xs text-stone-500">Gross Weight: <strong className="text-stone-700">7.720 kg</strong></span>
                    <div className="text-right">
                      <span className="text-3xs text-stone-400 block uppercase tracking-wider font-semibold">Total Amount Due</span>
                      <span className="text-base font-bold text-amber-800 font-mono">Rs. 23,296</span>
                    </div>
                  </div>
                </div>
                
                {/* Quick actions pane mockup */}
                <div className="md:col-span-4 space-y-3">
                  <div className="border border-stone-200/60 rounded-xl bg-white p-4 space-y-3.5">
                    <span className="text-xs font-semibold text-stone-700 block border-b border-stone-100 pb-2">Quick Commands</span>
                    <div className="grid grid-cols-2 gap-2 text-3xs font-medium">
                      <div className="rounded border border-amber-200 bg-amber-50/40 p-2 text-center text-amber-800 select-none cursor-default">F1: Read Weight</div>
                      <div className="rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700 select-none cursor-default">F2: Select Khaata</div>
                      <div className="rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700 select-none cursor-default">F5: Print Bill</div>
                      <div className="rounded border border-stone-200 bg-stone-50/50 p-2 text-center text-stone-700 select-none cursor-default">F9: Hold Sale</div>
                    </div>
                    <div className="rounded-lg bg-amber-700 text-amber-100 py-2 text-center text-xs font-semibold shadow-sm select-none cursor-default">
                      Instant Cash Checkout (F12)
                    </div>
                  </div>
                  
                  {/* Quick stats mini card mockup */}
                  <div className="border border-emerald-100 rounded-xl bg-emerald-50/30 p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-3xs text-emerald-700 font-semibold block uppercase tracking-wider">Today's Ledger Cashflow</span>
                      <span className="text-sm font-bold text-emerald-800 font-mono">Rs. 184,300</span>
                    </div>
                    <div className="rounded-full bg-emerald-100/70 p-1.5">
                      <TrendingUp className="size-4 text-emerald-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </section>

            {/* Three Dashboards Showcase in Urdu */}
            <section className="space-y-8 px-4" style={{ direction: "rtl" }}>
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/50 px-3.5 py-1 text-xs font-semibold text-amber-800">
                  مرکزی کنٹرول سسٹمز
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight leading-snug">
                  ہمارے پاس تین خصوصی سسٹم اور ڈیش بورڈز دستیاب ہیں
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto leading-relaxed">
                  الروحانی ڈرائی فروٹس اینڈ مصالحہ جات کے کاروبار کو منظم کرنے کے لیے سمارٹ انٹیگریٹڈ پینلز کا حسین امتزاج۔
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                {/* POS Dashboard */}
                <div className="rounded-2xl border border-amber-200/50 bg-white p-5 shadow-sm hover:shadow-md transition-all border-r-4 border-r-amber-700">
                  <div className="mb-4 rounded-xl bg-amber-50 p-3 w-fit text-amber-700 mr-0 ml-auto">
                    <Scale className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800 mb-2 font-[family:var(--font-outfit),system-ui,sans-serif]">
                    ۱. پی او ایس سیلز کاؤنٹر ڈیش بورڈ
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    تیز رفتار ریٹیل بلنگ، ڈیجیٹل اسکیل سے لائیو وزن ریڈنگ، کسٹمر ہولڈ بلنگ اور تھرمل بل پرنٹنگ کے لیے مخصوص سمارٹ سیلز کاؤنٹر۔
                  </p>
                </div>

                {/* Admin Dashboard */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-all border-r-4 border-r-stone-700">
                  <div className="mb-4 rounded-xl bg-stone-100 p-3 w-fit text-stone-700 mr-0 ml-auto">
                    <Cpu className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800 mb-2 font-[family:var(--font-outfit),system-ui,sans-serif]">
                    ۲. انتظامی ایڈمن ڈیش بورڈ
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    مکمل دکان کی نگرانی، ملازمین کے کنٹرول، کھاتہ لیجر اور کسٹمر اکاؤنٹس، نفع و نقصان کی تفصیلی رپورٹس، اور انتظامی سیٹنگز پینل۔
                  </p>
                </div>

                {/* Warehouse Dashboard */}
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm hover:shadow-md transition-all border-r-4 border-r-emerald-700">
                  <div className="mb-4 rounded-xl bg-emerald-50 p-3 w-fit text-emerald-700 mr-0 ml-auto">
                    <Warehouse className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800 mb-2 font-[family:var(--font-outfit),system-ui,sans-serif]">
                    ۳. گودام اور اسٹاک ڈیش بورڈ
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    گودام (Godown) میں بلک انوینٹری کی آمد، دکان کے کاؤنٹرز پر مال کی منتقلی، اور اسٹاک کی بیچ وائز اور ایکسپائری لائیو ٹریکنگ۔
                  </p>
                </div>
              </div>
            </section>

          {/* Features Showcase Grid */}
          <section className="space-y-8 px-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif]">
                Specially Configured Dry Fruits &amp; Masalajat Features
              </h2>
              <p className="text-sm sm:text-base text-stone-500 max-w-xl mx-auto">
                No generic storefront workflows here. Every feature has been polished to reflect specialized spice wholesale and dry fruit logistics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                >
                  <div className="mb-4 rounded-xl bg-amber-50 p-3 w-fit transition-all group-hover:bg-amber-100/80">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="block text-sm text-amber-700/85 font-semibold font-sans tracking-wide leading-relaxed" style={{ direction: "rtl", textAlign: "right" }}>
                      {f.urduTitle}
                    </span>
                    <h3 className="text-base font-bold text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif]">
                      {f.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed pt-1">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Developer Information & Marketing Section */}
            <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden mx-4">
              {/* Background elements */}
              <div className="pointer-events-none absolute -bottom-10 -right-10 -z-10 size-[200px] rounded-full bg-stone-50" />
              <div className="pointer-events-none absolute top-4 left-6 -z-10 text-stone-100 font-mono text-9xl select-none font-bold">
                &lt;/&gt;
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-1.5 rounded bg-stone-100 px-2.5 py-1 text-2xs font-mono text-stone-600">
                    <Cpu className="size-3.5" />
                    <span>Lead Developer Profile</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif]">
                    Software Developed by Umair
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    This custom-tailored point of sale (POS) and inventory ecosystem is fully designed and developed by <strong>Umair</strong>. Meticulously optimized for high-performance dry fruits bulk trading, integrated weighing scale communications, offline-resilient sales ticketing, and advanced dual accounting ledger (Khaata) layers.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-700">
                      <span className="font-semibold text-stone-500">Developer Email:</span>
                      <a href="mailto:umairdev89@gmail.com" className="text-amber-800 font-medium hover:underline">
                        umairdev89@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-700">
                      <span className="font-semibold text-stone-500">Contact Number:</span>
                      <a href="tel:03400728009" className="text-amber-800 font-mono font-semibold hover:underline">
                        03400728009
                      </a>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 border-l border-stone-200/80 pl-0 lg:pl-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-3xs uppercase font-semibold tracking-wider text-stone-400">Engineering Service Inquiries</span>
                    <p className="text-sm font-bold text-stone-800 font-[family:var(--font-outfit),system-ui,sans-serif]">
                      Custom Enterprise Dev
                    </p>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Need custom high-end business systems, localized wholesale databases, hardware printer configurations, or weighing scale integrations? Get in touch directly.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-3xs text-stone-600">
                    <span className="rounded bg-stone-100 px-2 py-0.5 border border-stone-200/40">React 19</span>
                    <span className="rounded bg-stone-100 px-2 py-0.5 border border-stone-200/40">Next.js 16</span>
                    <span className="rounded bg-stone-100 px-2 py-0.5 border border-stone-200/40">FastAPI</span>
                    <span className="rounded bg-stone-100 px-2 py-0.5 border border-stone-200/40">PostgreSQL</span>
                    <span className="rounded bg-stone-100 px-2 py-0.5 border border-stone-200/40">Weighing APIs</span>
                  </div>

                  <div className="border-t border-stone-100 pt-3">
                    <p className="text-3xs text-stone-400 font-medium">
                      Software Engineered by Umair. All Rights Reserved. Custom Tailored for Al Rohani Dry Fruits.
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

