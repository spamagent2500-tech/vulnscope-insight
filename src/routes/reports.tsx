import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions, classify, computeRisk, isClosed, SEVERITIES, STATUSES, useStore } from "@/lib/store";
import { Field, PageHeader, SevBadge } from "@/components/vs";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — VulnScope" },
      { name: "description", content: "Generate professional vulnerability assessment reports." },
      { property: "og:title", content: "Reports — VulnScope" },
      { property: "og:description", content: "Generate professional vulnerability assessment reports." },
    ],
  }),
  component: Reports,
});

const SECTIONS = ["Assessment summary", "Scope", "Assets analyzed", "Vulnerability statistics", "Critical/high findings", "Detailed findings", "Risk analysis", "Recommended remediation", "Remediation status"] as const;

function Reports() {
  const { assets, findings, scope } = useStore();
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(SECTIONS.map((s) => [s, true])));
  const amap = new Map(assets.map((a) => [a.id, a]));
  const rows = findings.map((f) => ({ f, a: amap.get(f.assetId), r: computeRisk(f, amap.get(f.assetId)), s: classify(f.cvss) })).sort((x, y) => y.r.score - x.r.score);
  const crit = rows.filter((x) => x.s === "Critical" || x.s === "High");
  const open = rows.filter((x) => !isClosed(x.f.status));
  const H = ({ n, t }: { n: number; t: string }) => <h2 className="mb-2 mt-8 border-b border-border pb-1 text-lg font-semibold"><span className="mr-2 font-mono text-primary">{String(n).padStart(2, "0")}</span>{t}</h2>;
  let n = 0;
  const show = (s: (typeof SECTIONS)[number]) => on[s];

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ scope, assets, findings: rows.map((x) => ({ ...x.f, severity: x.s, riskScore: x.r.score })) }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vulnscope-report.json";
    a.click();
  };

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Report Generator" sub="Choose sections, then print or save as PDF.">
          <Button variant="outline" onClick={exportJson}><Download className="h-4 w-4" />JSON</Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Print / PDF</Button>
        </PageHeader>
        <div className="panel mb-6 grid gap-4 md:grid-cols-3">
          <Field label="Assessment name"><input className="field" value={scope.name} maxLength={150} onChange={(e) => actions.setScope({ ...scope, name: e.target.value })} /></Field>
          <Field label="Assessor"><input className="field" value={scope.assessor} maxLength={100} onChange={(e) => actions.setScope({ ...scope, assessor: e.target.value })} /></Field>
          <Field label="Scope statement"><input className="field" value={scope.scope} maxLength={500} onChange={(e) => actions.setScope({ ...scope, scope: e.target.value })} /></Field>
          <div className="flex flex-wrap gap-3 md:col-span-3">
            {SECTIONS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-[var(--primary)]" checked={on[s]} onChange={(e) => setOn({ ...on, [s]: e.target.checked })} />{s}</label>
            ))}
          </div>
        </div>
      </div>

      <article className="panel mx-auto max-w-4xl !p-8 print:border-0 print:!p-0">
        <header className="border-b-2 border-primary pb-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">VulnScope · Confidential</p>
          <h1 className="mt-2 text-3xl font-semibold">{scope.name}</h1>
          <p className="text-sm text-muted-foreground">Generated {new Date().toLocaleDateString()} {scope.assessor && `· Assessor: ${scope.assessor}`}</p>
        </header>

        {show("Assessment summary") && (<>
          <H n={++n} t="Assessment summary" />
          <p className="text-sm">This authorized assessment covered {assets.length} assets and identified {findings.length} findings, of which {crit.length} are rated Critical or High. {open.length} findings remain open. The highest contextual risk score observed is {rows[0]?.r.score.toFixed(1) ?? "0.0"}/10.</p>
        </>)}
        {show("Scope") && (<><H n={++n} t="Scope" /><p className="text-sm">{scope.scope}</p><p className="mt-1 text-xs text-muted-foreground">All assets were confirmed as authorized for analysis. No exploitation or destructive testing was performed.</p></>)}
        {show("Assets analyzed") && (<>
          <H n={++n} t="Assets analyzed" />
          <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th>Asset</th><th>Host</th><th>OS</th><th>Environment</th><th>Owner</th></tr></thead>
            <tbody>{assets.map((a) => <tr key={a.id} className="border-t border-border"><td className="py-1">{a.name}</td><td className="font-mono text-xs">{a.host}</td><td>{a.os}</td><td>{a.environment}</td><td>{a.owner}</td></tr>)}</tbody></table>
        </>)}
        {show("Vulnerability statistics") && (<>
          <H n={++n} t="Vulnerability statistics" />
          <div className="grid grid-cols-5 gap-2 text-center">
            {SEVERITIES.map((s) => <div key={s} className="rounded border border-border p-2"><SevBadge s={s} /><p className="mt-1 font-mono text-2xl">{rows.filter((x) => x.s === s).length}</p></div>)}
          </div>
        </>)}
        {show("Critical/high findings") && (<>
          <H n={++n} t="Critical and high findings" />
          {crit.length ? <ul className="space-y-1 text-sm">{crit.map((x) => <li key={x.f.id} className="flex gap-2"><SevBadge s={x.s} />{x.f.title} <span className="text-muted-foreground">— {x.a?.name}</span></li>)}</ul> : <p className="text-sm">None.</p>}
        </>)}
        {show("Detailed findings") && (<>
          <H n={++n} t="Detailed findings" />
          <div className="space-y-4">
            {rows.map((x, i) => (
              <div key={x.f.id} className="break-inside-avoid rounded border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">F-{String(i + 1).padStart(3, "0")}</span><SevBadge s={x.s} /><b>{x.f.title}</b></div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{x.f.cve || "No CVE"} · CVSS {x.f.cvss.toFixed(1)} · {x.a?.name} · {x.f.software} {x.f.version}</p>
                <p className="mt-2">{x.f.description}</p>
                {x.f.evidence && <p className="mt-2"><b>Evidence:</b> <span className="font-mono text-xs">{x.f.evidence}</span></p>}
                {x.f.impact && <p className="mt-1"><b>Impact:</b> {x.f.impact}</p>}
                {x.f.references.length > 0 && <p className="mt-1 break-all text-xs"><b>References:</b> {x.f.references.join(", ")}</p>}
              </div>
            ))}
          </div>
        </>)}
        {show("Risk analysis") && (<>
          <H n={++n} t="Risk analysis" />
          <p className="mb-2 text-xs text-muted-foreground">Risk combines CVSS with asset importance, environment, exposure, exploit availability and business impact.</p>
          <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th>Finding</th><th>CVSS</th><th>Exposure</th><th>Exploit</th><th>Risk</th></tr></thead>
            <tbody>{rows.map((x) => <tr key={x.f.id} className="border-t border-border"><td className="py-1">{x.f.title}</td><td className="font-mono">{x.f.cvss.toFixed(1)}</td><td>{x.f.exposure}</td><td>{x.f.exploitAvailable}</td><td className="font-mono font-semibold">{x.r.score.toFixed(1)} ({x.r.rating})</td></tr>)}</tbody></table>
        </>)}
        {show("Recommended remediation") && (<>
          <H n={++n} t="Recommended remediation" />
          <ol className="list-decimal space-y-1 pl-5 text-sm">{open.map((x) => <li key={x.f.id}><b>{x.f.title}:</b> {x.f.remediation || "Remediation to be determined — verify with vendor advisory."}{x.f.dueDate && <span className="text-muted-foreground"> (due {x.f.dueDate})</span>}</li>)}</ol>
        </>)}
        {show("Remediation status") && (<>
          <H n={++n} t="Remediation status" />
          <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
            {STATUSES.map((s) => <div key={s} className="rounded border border-border p-2"><p className="text-xs text-muted-foreground">{s}</p><p className="font-mono text-xl">{findings.filter((f) => f.status === s).length}</p></div>)}
          </div>
        </>)}
      </article>
    </>
  );
}
