import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  large?: boolean;
}

export function Card({ large, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-line rounded-lg overflow-hidden",
        large ? "shadow-card-lg" : "shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
