import type { Metadata } from "next";
import { ShopPage } from "./ShopPage";

export const metadata: Metadata = {
  title: "Shop · Nano Protein Ice Cream",
  description: "Browse the Nano Protein Ice Cream flavours and add tubs to your cart.",
};

export default function Page() {
  return <ShopPage />;
}
