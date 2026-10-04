import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/store";

const sevCls: Record<Severity, string> = {
  Critical: "bg-sev-critical/15 text-sev-critical border-sev-critical/40",
  High: "bg-sev-high/15 text-sev-high border-sev-high/40",
  Medium: "bg-sev-medium/15 text-sev-medium border-sev-medium/40",
  Low: "bg-sev-low/15 text-sev-low border-sev-low/40",
  Informational: "bg-sev-info/15 text-sev-info border-sev-info/40",
};
export const sevText: Record<Severity, string> = {
  Critical: "text-sev-critical",
  High: "text-sev-high",
  Medium: "text-sev-medium",
  Low: "text-sev-low",
  Informational: "text-sev-info",
};

export function SevBadge({ s }: { s: Severity }) {
  return <span className={cn("inline-flex rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider", sevCls[s])}>{s}</span>;
}

export function StatusBadge({ s }: { s: string }) {
  const tone = s === "Resolved" ? "border-primary/40 text-primary" : s === "Open" ? "border-sev-critical/40 text-sev-critical" : "border-border text-muted-foreground";
  return <span className={cn("inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-xs", tone)}>{s}</span>;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">// VulnScope</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
