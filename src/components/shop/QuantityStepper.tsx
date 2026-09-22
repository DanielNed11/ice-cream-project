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
  const button =
    "flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-lg " +
    "leading-none text-white transition-colors hover:bg-white/10 disabled:opacity-30 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <div className="flex items-center gap-3">
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
      <span aria-live="polite" aria-atomic="true" className="w-8 text-center font-mono text-sm text-white">
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
