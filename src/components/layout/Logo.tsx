import Link  from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="SBFiles"
      className="flex items-center gap-2 sm:gap-3 min-w-0 shrink overflow-hidden"
    >
      <span className="sr-only">SBFiles</span>

      {/* Logo-mark: car + "SB" badge — always visible */}
      <Image
        src="/logo-mark.png"
        alt=""
        width={908}
        height={399}
        className="h-7 sm:h-9 md:h-10 w-auto object-contain flex-none"
        priority
      />

      {/* Wordmark: "FILES" lettering — hidden below 400 px */}
      <Image
        src="/logo-wordmark.png"
        alt=""
        width={954}
        height={57}
        className="hidden xs:block h-3.5 sm:h-4 md:h-5 w-auto object-contain flex-none"
        priority
      />
    </Link>
  );
}
