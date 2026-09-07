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

      {/* Logo-mark: LCP element — WebP 320×141 (2× of max display 73 px wide) */}
      <Image
        src="/logo-mark.webp"
        alt=""
        width={320}
        height={141}
        sizes="(max-width: 640px) 56px, (max-width: 768px) 65px, 73px"
        className="h-6 sm:h-7 md:h-8 w-auto object-contain flex-none"
        priority
        fetchPriority="high"
      />

      {/* Wordmark: "FILES" lettering — WebP 800×48, hidden below 400 px */}
      <Image
        src="/logo-wordmark.webp"
        alt=""
        width={800}
        height={48}
        sizes="(max-width: 640px) 224px, (max-width: 768px) 245px, 267px"
        className="hidden xs:block h-3 sm:h-3.5 md:h-4 w-auto object-contain flex-none"
        priority
      />
    </Link>
  );
}
