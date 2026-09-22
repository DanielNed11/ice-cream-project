import type { Metadata } from "next";
import { CartPage } from "./CartPage";

export const metadata: Metadata = {
  title: "Cart · Nano Protein Ice Cream",
  description: "Review the tubs in your cart and check out.",
};

export default function Page() {
  return <CartPage />;
}
