import type { Metadata } from "next";
import { AccountPage } from "./AccountPage";

export const metadata: Metadata = {
  title: "Your account · Nano Protein Ice Cream",
  description: "Your Nano Protein Ice Cream profile and order history.",
};

export default function Page() {
  return <AccountPage />;
}
