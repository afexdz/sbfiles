import Link  from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="SBFiles"
      className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink overflow-hidden"
    >
      <span className="sr-only">SBFiles</span>

      {/* Logo-mark: car + "SB" badge — always visible */}
      <Image
        src="/logo-mark.png"
        alt=""
        width={908}
        height={399}
        className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-none"
        priority
      />

      {/* Wordmark: "FILES" lettering — hidden below 400 px */}
      <Image
        src="/logo-wordmark.png"
        alt=""
        width={954}
        height={57}
        className="hidden xs:block h-3 sm:h-3.5 md:h-4 w-auto object-contain flex-none"
        priority
      />
    </Link>
  );
}
