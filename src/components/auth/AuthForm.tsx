"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { variants } from "@/lib/variants";
import { ActionButton, TextLink } from "@/components/store/Action";

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

  // Playfair italic is the landing page's accent voice, so the one short
  // supporting line gets it and the heading stays Inter 800.
  const accent = withName ? "Three flavours, one standard." : "Good to see you again.";

  // 48px tall, so the field is comfortably above the 44px touch minimum.
  const field =
    "h-12 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 text-sm text-white " +
    "transition-colors placeholder:text-white/60 hover:border-white/25 focus:border-white/40 focus-ring";

  const label = "mb-2 block font-mono text-[0.7rem] tracking-[0.25em] text-white/60 uppercase";

  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 pb-20 ${NAVBAR_HEIGHT_CLASS}`}
    >
      <div className="rise-in">
        {/* The three flavours, as a quiet brand mark. */}
        <div aria-hidden="true" className="flex gap-1.5">
          {variants.map((variant) => (
            <span
              key={variant.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: variant.themeColor }}
            />
          ))}
        </div>

        {/* A one-word section label, like the landing page's eyebrows -- the
            heading itself comes from the caller. */}
        <p className="eyebrow mt-6">{withName ? "Register" : "Sign in"}</p>
        <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-3 font-serif text-lg text-white/70 italic">{accent}</p>

        <form onSubmit={handleSubmit} className="surface-panel mt-8 space-y-5 p-6 sm:p-8">
          {withName && (
            <label className="block">
              <span className={label}>Name</span>
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
            <span className={label}>Email</span>
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
            <span className={label}>Password</span>
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
            <p
              role="alert"
              className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <ActionButton type="submit" disabled={submitting} aria-busy={submitting} fullWidth>
            {submitting ? "Please wait…" : submitLabel}
          </ActionButton>
        </form>

        <p className="mt-6 text-sm text-white/60">
          {footer.prompt} <TextLink href={footer.href}>{footer.label}</TextLink>
        </p>
      </div>
    </main>
  );
}
