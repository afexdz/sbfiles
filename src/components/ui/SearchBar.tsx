import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ containerClassName, className, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-[10px] bg-card border border-line2 rounded-[6px]",
          "px-4 py-[13px] shadow-card transition-[border-color,box-shadow] duration-200",
          "focus-within:border-ember focus-within:shadow-[0_0_0_4px_var(--ember-soft)]",
          containerClassName
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[19px] h-[19px] shrink-0 stroke-mute fill-none"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5 21 21" />
        </svg>
        <input
          ref={ref}
          type="search"
          className={cn(
            "border-none outline-none flex-1 text-base bg-transparent placeholder:text-mute",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
