import { Outfit, Poppins } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "POS",
  description: "Point of sale application",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="h-full m-0 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
