import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost" | "stage";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  pressed?: boolean;
}

export function Button({
  variant = "solid",
  pressed,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-pressed={variant === "stage" ? pressed : undefined}
      className={cn(
        "cursor-pointer transition-all duration-[180ms]",
        variant === "solid" && [
          "bg-ember text-white border-none px-[18px] py-[10px] rounded font-semibold text-sm",
          "shadow-[0_4px_14px_-6px_rgba(255,77,18,.7)]",
          "hover:bg-ember-ink hover:-translate-y-px",
        ],
        variant === "ghost" && [
          "border border-line2 bg-card px-[15px] py-[9px] rounded text-sm",
          "hover:border-ink2 hover:shadow-card",
        ],
        variant === "stage" && [
          "border border-line2 bg-card px-[14px] py-[8px] rounded-full text-[13.5px] text-ink2",
          "hover:border-ink2",
          "aria-pressed:bg-ember aria-pressed:border-ember aria-pressed:text-white aria-pressed:font-semibold",
          "aria-pressed:shadow-[0_4px_12px_-5px_rgba(255,77,18,.8)]",
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
