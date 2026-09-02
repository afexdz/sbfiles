import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn(
        "flex flex-wrap items-center gap-[7px] text-[13.5px] text-mute py-4",
        className
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {isLast ? (
              <span className="text-ink font-medium">{item.label}</span>
            ) : (
              <BreadcrumbLink item={item} />
            )}
            {!isLast && (
              <span className="text-line2" aria-hidden>
                ›
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

function BreadcrumbLink({ item }: { item: BreadcrumbItem }) {
  if (item.href) {
    return (
      <a href={item.href} className="hover:text-ember-ink transition-colors duration-[180ms]">
        {item.label}
      </a>
    );
  }
  return (
    <button
      onClick={item.onClick}
      className="cursor-pointer hover:text-ember-ink transition-colors duration-[180ms]"
    >
      {item.label}
    </button>
  );
}
