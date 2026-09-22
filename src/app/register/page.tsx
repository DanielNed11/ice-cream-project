import type { Metadata } from "next";
import { RegisterPage } from "./RegisterPage";

export const metadata: Metadata = {
  title: "Create account · Nano Protein Ice Cream",
  description: "Create a Nano Protein Ice Cream account.",
};

export default function Page() {
  return <RegisterPage />;
}
