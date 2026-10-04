import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classify, computeRisk, SEVERITIES, STATUSES, useStore } from "@/lib/store";
import { Field, PageHeader, SevBadge, StatusBadge, sevText } from "@/components/vs";

export const Route = createFileRoute("/findings/")({
  head: () => ({
    meta: [
      { title: "Findings — VulnScope" },
      { name: "description", content: "Search and filter vulnerability findings by severity, CVE, asset, OS, status and CVSS." },
      { property: "og:title", content: "Findings — VulnScope" },
      { property: "og:description", content: "Search and filter vulnerability findings by severity, CVE, asset, OS, status and CVSS." },
    ],
  }),
  component: Findings,
});

const init = { q: "", sev: "", cve: "", asset: "", os: "", status: "", min: 0, max: 10, from: "", to: "" };

function Findings() {
  const { assets, findings } = useStore();
  const [f, setF] = useState(init);
  const [sort, setSort] = useState<"risk" | "cvss" | "date">("risk");
  const amap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const oses = [...new Set(assets.map((a) => a.os).filter(Boolean))];
  const set = (k: keyof typeof init, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const rows = findings
    .map((x) => ({ x, a: amap.get(x.assetId), risk: computeRisk(x, amap.get(x.assetId)) }))
    .filter(({ x, a }) => {
      const q = f.q.toLowerCase();
      if (q && ![x.title, x.cve, x.description, x.software, a?.name, a?.host, x.evidence].join(" ").toLowerCase().includes(q)) return false;
      if (f.sev && classify(x.cvss) !== f.sev) return false;
      if (f.cve && !x.cve.toLowerCase().includes(f.cve.toLowerCase())) return false;
      if (f.asset && x.assetId !== f.asset) return false;
      if (f.os && a?.os !== f.os) return false;
      if (f.status && x.status !== f.status) return false;
      if (x.cvss < f.min || x.cvss > f.max) return false;
      if (f.from && x.discovered < f.from) return false;
      if (f.to && x.discovered > f.to) return false;
      return true;
    })
    .sort((p, q) => (sort === "risk" ? q.risk.score - p.risk.score : sort === "cvss" ? q.x.cvss - p.x.cvss : q.x.discovered.localeCompare(p.x.discovered)));

  return (
    <>
      <PageHeader title="Vulnerability Findings" sub={`${rows.length} of ${findings.length} findings`}>
        <Button asChild><Link to="/findings/new">Add finding</Link></Button>
      </PageHeader>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field !py-2.5 !pl-9" placeholder="Search titles, CVEs, assets, software, evidence…" value={f.q} onChange={(e) => set("q", e.target.value)} />
      </div>
      <div className="panel mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <Field label="Severity"><select className="field" value={f.sev} onChange={(e) => set("sev", e.target.value)}><option value="">All</option>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="CVE"><input className="field font-mono" value={f.cve} onChange={(e) => set("cve", e.target.value)} /></Field>
        <Field label="Asset"><select className="field" value={f.asset} onChange={(e) => set("asset", e.target.value)}><option value="">All</option>{assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="OS"><select className="field" value={f.os} onChange={(e) => set("os", e.target.value)}><option value="">All</option>{oses.map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Status"><select className="field" value={f.status} onChange={(e) => set("status", e.target.value)}><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="CVSS min–max">
          <div className="flex gap-1">
            <input type="number" min={0} max={10} step={0.1} className="field" value={f.min} onChange={(e) => set("min", Number(e.target.value))} />
            <input type="number" min={0} max={10} step={0.1} className="field" value={f.max} onChange={(e) => set("max", Number(e.target.value))} />
          </div>
        </Field>
        <Field label="From"><input type="date" className="field" value={f.from} onChange={(e) => set("from", e.target.value)} /></Field>
        <Field label="To"><input type="date" className="field" value={f.to} onChange={(e) => set("to", e.target.value)} /></Field>
      </div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex gap-2 text-muted-foreground">Sort:
          {(["risk", "cvss", "date"] as const).map((s) => <button key={s} onClick={() => setSort(s)} className={sort === s ? "text-primary" : "hover:text-foreground"}>{s}</button>)}
        </div>
        <button onClick={() => setF(init)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" />Clear filters</button>
      </div>
      <div className="panel overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>{["Severity", "Finding", "CVE", "Asset", "CVSS", "Risk", "Status", "Discovered"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ x, a, risk }) => (
              <tr key={x.id} className="hover:bg-muted/40">
                <td className="p-3"><SevBadge s={classify(x.cvss)} /></td>
                <td className="max-w-xs p-3"><Link to="/findings/$id" params={{ id: x.id }} className="font-medium hover:text-primary">{x.title}</Link></td>
                <td className="p-3 font-mono text-xs">{x.cve || "—"}</td>
                <td className="p-3">{a?.name}</td>
                <td className="p-3 font-mono">{x.cvss.toFixed(1)}</td>
                <td className={`p-3 font-mono font-semibold ${sevText[risk.rating]}`}>{risk.score.toFixed(1)}</td>
                <td className="p-3"><StatusBadge s={x.status} /></td>
                <td className="p-3 font-mono text-xs">{x.discovered}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No findings match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
