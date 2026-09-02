type Primitive = string | false | null | undefined;
type ClassValue = Primitive | Primitive[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((c) => (Array.isArray(c) ? c : [c]))
    .filter(Boolean)
    .join(" ");
}

export function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}
