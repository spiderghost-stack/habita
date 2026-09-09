export function formatFcfa(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export function monthLabel(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
