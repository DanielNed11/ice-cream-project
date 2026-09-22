"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/lib/auth/AuthProvider";

export function LoginPage() {
  const { login } = useAuth();

  return (
    <AuthForm
      title="Welcome back"
      submitLabel="Sign in"
      onSubmit={({ email, password }) => login(email, password)}
      footer={{ prompt: "No account yet?", href: "/register", label: "Create one" }}
    />
  );
}
