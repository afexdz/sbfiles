// DB slug → actual filename stem when they differ.
// Imported by both BrandLogo.tsx (client) and page.tsx (server).
export const FILE_SLUG: Readonly<Record<string, string>> = {
  "land-rover":      "landrover",
  "mercedes-benz":   "mercedes",
  "mercedes-citaro": "mercedes",
};
export function fileSlug(slug: string): string { return FILE_SLUG[slug] ?? slug; }
