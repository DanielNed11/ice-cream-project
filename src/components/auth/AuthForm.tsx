"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  /** Registration collects a name; sign in does not. */
  withName?: boolean;
  onSubmit: (values: { name: string; email: string; password: string }) => Promise<void>;
  footer: { prompt: string; href: "/login" | "/register"; label: string };
}

export function AuthForm({ title, submitLabel, withName = false, onSubmit, footer }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ name, email, password });
      router.push("/account");
    } catch (cause) {
      // The backend returns a readable message for 400/401/409; anything else
      // is unexpected and should not be shown verbatim.
      setError(
        cause instanceof ApiError && cause.status < 500
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white " +
    "placeholder:text-white/60 focus:border-white/40 focus:outline-none";

  return (
    <main className={`mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 pb-16 ${NAVBAR_HEIGHT_CLASS}`}>
      <h1 className="font-serif text-4xl italic text-white">{title}</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {withName && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">Name</span>
            <input
              className={field}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">Email</span>
          <input
            className={field}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-widest text-white/50">Password</span>
          <input
            className={field}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={withName ? "new-password" : "current-password"}
            required
          />
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Please wait…" : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-white/50">
        {footer.prompt}{" "}
        <Link href={footer.href} className="text-white underline underline-offset-4">
          {footer.label}
        </Link>
      </p>
    </main>
  );
}
