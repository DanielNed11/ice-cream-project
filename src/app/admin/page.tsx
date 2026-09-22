import type { Metadata } from "next";
import { AdminOrdersPage } from "./AdminOrdersPage";

export const metadata: Metadata = {
  title: "Admin orders · Nano Protein Ice Cream",
  description: "Order analytics, filtering and spreadsheet export for staff.",
};

export default function Page() {
  return <AdminOrdersPage />;
}
