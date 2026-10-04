import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions, classify, computeRisk, STATUSES, useStore, type Status } from "@/lib/store";
import { Field, PageHeader, SevBadge, StatusBadge, sevText } from "@/components/vs";
import { CvePanel } from "@/components/CvePanel";

export const Route = createFileRoute("/findings/$id")({
  head: () => ({
    meta: [
      { title: "Finding Details — VulnScope" },
      { name: "description", content: "Vulnerability details, risk rationale and remediation tracking." },
      { property: "og:title", content: "Finding Details — VulnScope" },
      { property: "og:description", content: "Vulnerability details, risk rationale and remediation tracking." },
    ],
  }),
  component: Detail,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const { findings, assets } = useStore();
  const nav = useNavigate();
  const f = findings.find((x) => x.id === id);
  const [note, setNote] = useState("");
  if (!f) return <div className="panel">Finding not found. <Link to="/findings" className="text-primary">Back</Link></div>;
  const asset = assets.find((a) => a.id === f.assetId);
  const risk = computeRisk(f, asset);
  const sev = classify(f.cvss);
  const upd = actions.updateFinding.bind(null, f.id);

  return (
    <>
      <PageHeader title={f.title} sub={`${f.cve || "No CVE"} · ${asset?.name ?? "Unknown asset"}`}>
        <Button variant="outline" size="icon" aria-label="Delete" onClick={() => { if (confirm("Delete this finding?")) { actions.deleteFinding(f.id); nav({ to: "/findings" }); } }}><Trash2 className="h-4 w-4" /></Button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="panel grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Section title="Severity"><SevBadge s={sev} /></Section>
            <Section title="CVSS"><span className={`font-mono text-2xl ${sevText[sev]}`}>{f.cvss.toFixed(1)}</span></Section>
            <Section title="Risk score"><span className={`font-mono text-2xl ${sevText[risk.rating]}`}>{risk.score.toFixed(1)}</span></Section>
            <Section title="Status"><StatusBadge s={f.status} /></Section>
          </div>
          <div className="panel space-y-4">
            <Section title="Description">{f.description || <em className="text-muted-foreground">None provided</em>}</Section>
            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Affected asset">{asset ? `${asset.name} — ${asset.host} (${asset.os}, ${asset.environment})` : "—"}</Section>
              <Section title="Affected software">{f.software || "—"} <span className="font-mono text-muted-foreground">{f.version}</span></Section>
              <Section title="Discovered"><span className="font-mono">{f.discovered}</span></Section>
              <Section title="Verification">
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--primary)]" checked={f.verified} onChange={(e) => upd({ verified: e.target.checked })} />{f.verified ? "Verified" : "Unverified"}</label>
              </Section>
            </div>
            <Section title="Evidence"><pre className="whitespace-pre-wrap rounded bg-background p-3 font-mono text-xs">{f.evidence || "No evidence recorded."}</pre></Section>
            <Section title="Potential impact">{f.impact || "—"}</Section>
            <Section title="Recommended remediation">{f.remediation || "—"}</Section>
            <Section title="References">
              {f.references.length ? <ul className="space-y-0.5">{f.references.map((r) => <li key={r}><a className="break-all text-primary hover:underline" href={r} target="_blank" rel="noreferrer">{r}</a></li>)}</ul> : "—"}
            </Section>
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">VulnScope documents vulnerabilities for defensive remediation only and does not provide exploitation guidance.</p>
          </div>

          <div className="panel">
            <p className="mb-3 font-semibold">Why this risk rating: <span className={sevText[risk.rating]}>{risk.rating}</span></p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {risk.factors.map((r) => (
                  <tr key={r.label}><td className="py-2 pr-3 text-muted-foreground">{r.label}</td><td className="py-2 pr-3 font-mono">{r.value}</td><td className="py-2">{r.effect}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {f.cve && <CvePanel cve={f.cve} />}
        </div>

        <div className="panel space-y-4 self-start">
          <p className="font-semibold">Remediation management</p>
          <Field label="Status">
            <select className="field" value={f.status} onChange={(e) => { upd({ status: e.target.value as Status, notes: [...f.notes, { at: new Date().toISOString(), text: `Status changed to ${e.target.value}` }] }); toast.success("Status updated"); }}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Due date"><input type="date" className="field" value={f.dueDate} onChange={(e) => upd({ dueDate: e.target.value })} /></Field>
          <Field label="Recommended remediation"><textarea rows={3} className="field" value={f.remediation} onChange={(e) => upd({ remediation: e.target.value })} /></Field>
          <Field label="Add note">
            <textarea rows={2} className="field" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button className="w-full" disabled={!note.trim()} onClick={() => { upd({ notes: [...f.notes, { at: new Date().toISOString(), text: note.trim() }] }); setNote(""); }}>Add note</Button>
          <ul className="max-h-72 space-y-2 overflow-auto">
            {[...f.notes].reverse().map((n, i) => (
              <li key={i} className="border-l-2 border-primary/50 pl-3 text-sm">
                <p className="font-mono text-[10px] text-muted-foreground">{new Date(n.at).toLocaleString()}</p>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
