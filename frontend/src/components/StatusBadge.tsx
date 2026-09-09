const LABELS: Record<string, { label: string; className: string }> = {
  UP_TO_DATE: { label: "À jour", className: "bg-petrole-100 text-petrole-700" },
  DUE_SOON: { label: "Échéance proche", className: "bg-or-100 text-or-600" },
  LATE: { label: "En retard", className: "bg-or-400/20 text-or-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = LABELS[status] ?? { label: status, className: "bg-petrole-100 text-petrole-700" };
  return <span className={`px-2 py-0.5 text-xs ${cfg.className}`}>{cfg.label}</span>;
}
