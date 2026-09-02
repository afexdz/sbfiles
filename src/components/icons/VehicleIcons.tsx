import React, { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function VehicleIcon({
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <path d="M6 40h52M9 40V27l6-13h26l9 13v13M15 27h30M14 40v5M50 40v5M18 20h20M13 33h6M45 33h6" />
      <circle cx="21" cy="41" r="5" />
      <circle cx="45" cy="41" r="5" />
    </VehicleIcon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <path d="M4 40V15h32v25M36 24h11l11 11v5M4 40h54M12 40v5M48 40v5M9 21h20" />
      <circle cx="18" cy="41" r="5" />
      <circle cx="46" cy="41" r="5" />
    </VehicleIcon>
  );
}

export function MotoIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <circle cx="14" cy="40" r="10" />
      <circle cx="50" cy="40" r="10" />
      <path d="M14 40l13-15h15l7 15M27 25l-6-8h-7M42 18h10M22 33h14" />
    </VehicleIcon>
  );
}

export function QuadIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <circle cx="15" cy="40" r="9" />
      <circle cx="49" cy="40" r="9" />
      <path d="M15 40h34M20 31l7-12h13l6 12M26 15h12M12 26h6M46 26h6" />
    </VehicleIcon>
  );
}

export function JetIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <path d="M5 43c6 5 14 5 21 0s16-5 22 0 8 3 9 1M11 36l10-15h20l8 15zM28 21v-8h7M14 36h34" />
    </VehicleIcon>
  );
}

export function TractorIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <circle cx="17" cy="40" r="12" />
      <circle cx="47" cy="43" r="8" />
      <path d="M17 28V13h15l6 15M32 13h8M38 28h12v15M8 22h9" />
    </VehicleIcon>
  );
}

export function ExcavatorIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <path d="M5 46h30V32H5zM11 46V32M24 46V32M35 40l9-22 13 6M44 18l-4-8M9 46v5M31 46v5M50 24l6 10" />
    </VehicleIcon>
  );
}

export function BusIcon(props: IconProps) {
  return (
    <VehicleIcon {...props}>
      <rect x="9" y="12" width="44" height="30" rx="3" />
      <path d="M9 22h44M22 12v10M40 12v10M15 42v5M47 42v5M14 32h6M42 32h6" />
    </VehicleIcon>
  );
}

export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  /* reference.html keys */
  car:          CarIcon,
  truck:        TruckIcon,
  moto:         MotoIcon,
  quad:         QuadIcon,
  jet:          JetIcon,
  tract:        TractorIcon,
  exca:         ExcavatorIcon,
  bus:          BusIcon,
  /* DB seed keys */
  bike:         MotoIcon,
  zap:          QuadIcon,
  anchor:       JetIcon,
  sprout:       TractorIcon,
  construction: ExcavatorIcon,
};
