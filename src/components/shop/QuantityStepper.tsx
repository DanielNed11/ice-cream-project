"use client";

interface QuantityStepperProps {
  quantity: number;
  max: number;
  busy?: boolean;
  onChange: (quantity: number) => void;
  label: string;
}

/**
 * Decrementing to 0 is allowed and means "remove" -- the backend treats a
 * quantity of 0 as a removal, so the control does not need a separate button.
 */
export function QuantityStepper({ quantity, max, busy = false, onChange, label }: QuantityStepperProps) {
  // 44px square targets inside a single rounded-full group, so the control
  // reads as one object in the same pill language as the landing page's CTAs.
  const button =
    "flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none text-white " +
    "transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-95 " +
    "motion-reduce:transition-none motion-reduce:active:scale-100 " +
    "disabled:pointer-events-none disabled:opacity-30 focus-ring";

  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] p-1">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        // Not disabled while busy: disabling the focused button drops focus to
        // the document body. Quantities are sent as absolute values, so an
        // extra press is harmless.
        aria-busy={busy}
        disabled={quantity <= 0}
        aria-label={`Remove one ${label}`}
        className={button}
      >
        −
      </button>

      {/* Announced on every change, atomic so the product name goes with the
          number rather than a bare "3". */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="w-10 text-center font-mono text-sm tabular-nums text-white"
      >
        <span className="sr-only">{label}: </span>
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-busy={busy}
        disabled={quantity >= max}
        aria-label={`Add one ${label}`}
        className={button}
      >
        +
      </button>
    </div>
  );
}
