export function formatEUR(n: number): string {
  const [int, dec] = n.toFixed(2).split(".");
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `€${intFormatted},${dec}`;
}
