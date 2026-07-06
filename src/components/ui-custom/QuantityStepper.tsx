import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantityStepperProps) {
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const label = size === "sm" ? "w-9 text-sm" : "w-12 text-[0.95rem]";

  return (
    <div
      className={cn(
        "inline-flex items-center border border-border bg-background",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          "grid place-items-center text-foreground transition-colors hover:text-primary disabled:opacity-40",
          dim,
        )}
      >
        <Minus size={14} strokeWidth={1.75} />
      </button>
      <span
        className={cn(
          "grid place-items-center font-serif text-foreground",
          label,
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          "grid place-items-center text-foreground transition-colors hover:text-primary disabled:opacity-40",
          dim,
        )}
      >
        <Plus size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}
