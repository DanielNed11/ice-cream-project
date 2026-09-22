"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();

  return (
    <AuthForm
      title="Create account"
      submitLabel="Create account"
      withName
      onSubmit={({ name, email, password }) => register(name, email, password)}
      footer={{ prompt: "Already have an account?", href: "/login", label: "Sign in" }}
    />
  );
}
