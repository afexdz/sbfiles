import Link  from "next/link";
import Image from "next/image";

/* Intrinsic dimensions of the source PNGs — used to preserve aspect ratio */
const MARK_W = 908;
const MARK_H = 399;
const WORD_W = 954;
const WORD_H = 57;

interface Props {
  markHeight?: number;
  wordHeight?: number;
}

export function Logo({ markHeight = 42, wordHeight = 22 }: Props) {
  const markDisplayW = Math.round(markHeight * (MARK_W / MARK_H));
  const wordDisplayW = Math.round(wordHeight * (WORD_W / WORD_H));

  return (
    <Link
      href="/"
      aria-label="SBFiles"
      className="flex items-center gap-3"
    >
      <span className="sr-only">SBFiles</span>

      {/* Logo-mark: the car + "SB" badge */}
      <Image
        src="/logo-mark.png"
        alt=""
        width={markDisplayW}
        height={markHeight}
        style={{ width: "auto" }}
        priority
      />

      {/* Wordmark: the "FILES" lettering */}
      <Image
        src="/logo-wordmark.png"
        alt=""
        width={wordDisplayW}
        height={wordHeight}
        style={{ width: "auto" }}
        priority
      />
    </Link>
  );
}
