import type { Metadata } from "next";
import { LoginPage } from "./LoginPage";

export const metadata: Metadata = {
  title: "Sign in · Nano Protein Ice Cream",
  description: "Sign in to your Nano Protein Ice Cream account.",
};

export default function Page() {
  return <LoginPage />;
}
