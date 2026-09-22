import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Navbar } from "@/components/navbar/Navbar";
import { CartProvider } from "@/lib/cart/CartProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Nano Protein Ice Cream",
  description:
    "Premium protein ice cream in Banana, Chocolate, and Strawberry. 20-22g of protein per tub, real ingredients, zero compromise.",
  openGraph: {
    title: "Nano Protein Ice Cream",
    description: "Premium protein ice cream in Banana, Chocolate, and Strawberry.",
    images: ["/lifestyle/banana-product.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body id="top" className="min-h-full bg-black text-white">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
            {/* Lives here rather than on the landing page so every route,
                including the store and admin pages, ends the same way. */}
            <footer className="border-t border-white/10 px-6 py-10 text-center font-mono text-xs tracking-widest text-white/60 uppercase sm:px-10">
              Nano Protein Ice Cream -- portfolio demo
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
