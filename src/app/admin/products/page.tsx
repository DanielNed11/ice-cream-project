import type { Metadata } from "next";
import { AdminProductsPage } from "./AdminProductsPage";

export const metadata: Metadata = {
  title: "Admin products · Nano Protein Ice Cream",
  description: "Create, edit and withdraw products.",
};

export default function Page() {
  return <AdminProductsPage />;
}
