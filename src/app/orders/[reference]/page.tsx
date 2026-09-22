import type { Metadata } from "next";
import { OrderPage } from "./OrderPage";

export const metadata: Metadata = {
  title: "Your order · Nano Protein Ice Cream",
  description: "The details of a Nano Protein Ice Cream order.",
};

export default function Page({ params }: { params: Promise<{ reference: string }> }) {
  return <OrderPage params={params} />;
}
