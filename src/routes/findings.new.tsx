import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { actions, classify, today, uid, useStore, LEVELS, type Finding, type Level } from "@/lib/store";
import { Field, PageHeader, SevBadge } from "@/components/vs";
import { CvePanel } from "@/components/CvePanel";

export const Route = createFileRoute("/findings/new")({
  head: () => ({
    meta: [
      { title: "Add Finding — VulnScope" },
      { name: "description", content: "Record or import vulnerability findings with automatic severity classification." },
      { property: "og:title", content: "Add Finding — VulnScope" },
      { property: "og:description", content: "Record or import vulnerability findings with automatic severity classification." },
    ],
  }),
  component: NewFinding,
});

const schema = z.object({
  cve: z.string().trim().regex(/^(CVE-\d{4}-\d{4,})?$/i, "CVE ID must look like CVE-YYYY-NNNN").max(30),
  title: z.string().trim().min(1, "Title required").max(200),
  description: z.string().max(5000),
  assetId: z.string().min(1, "Select an affected asset"),
  software: z.string().max(200),
  version: z.string().max(100),
  cvss: z.number().min(0).max(10),
  evidence: z.string().max(5000),
  discovered: z.string().min(1),
});

const blank = (assetId = ""): Finding => ({
  id: "", cve: "", title: "", description: "", assetId, software: "", version: "", cvss: 5, evidence: "", discovered: today(),
  exposure: "Internal", exploitAvailable: "None known", businessImpact: "Medium", impact: "", remediation: "", references: [],
  status: "Open", verified: false, dueDate: "", notes: [],
});

function NewFinding() {
  const { assets } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState<Finding>(blank(assets[0]?.id));
  const [importText, setImportText] = useState("");
  const set = <K extends keyof Finding>(k: K, v: Finding[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) return toast.error(r.error.issues[0].message);
    const id = uid();
    actions.saveFinding({ ...f, id, cve: f.cve.toUpperCase().trim() });
    toast.success("Finding recorded");
    nav({ to: "/findings/$id", params: { id } });
  };

  const doImport = () => {
    try {
      const rows = JSON.parse(importText);
      const list = Array.isArray(rows) ? rows : [rows];
      let n = 0;
      for (const row of list) {
        const asset = assets.find((a) => a.id === row.assetId || a.name === row.asset || a.host === row.asset);
        const cand = { ...blank(asset?.id ?? ""), ...row, assetId: asset?.id ?? "", cvss: Number(row.cvss ?? 0) };
        if (!schema.safeParse(cand).success) continue;
        actions.saveFinding({ ...cand, id: uid(), notes: [], references: Array.isArray(row.references) ? row.references.map(String) : [] });
        n++;
      }
      toast.success(`Imported ${n} of ${list.length} findings`);
      if (n) setImportText("");
    } catch {
      toast.error("Invalid JSON");
    }
  };

  if (!assets.length)
    return (
      <div className="panel text-center">
        <p>Register an authorized asset first.</p>
        <Link to="/assets" className="text-primary hover:underline">Go to assets →</Link>
      </div>
    );

  return (
    <>
      <PageHeader title="Add Vulnerability Finding" sub="Severity is classified automatically from the CVSS score." />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="panel grid gap-3 sm:grid-cols-2">
          <Field label="CVE ID (optional)"><input className="field font-mono" placeholder="CVE-2021-44228" value={f.cve} onChange={(e) => set("cve", e.target.value)} /></Field>
          <Field label="Affected asset">
            <select className="field" value={f.assetId} onChange={(e) => set("assetId", e.target.value)}>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.host})</option>)}
            </select>
          </Field>
          <Field label="Vulnerability title" className="sm:col-span-2"><input className="field" value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea rows={3} className="field" value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Affected service / software"><input className="field" value={f.software} onChange={(e) => set("software", e.target.value)} /></Field>
          <Field label="Installed version"><input className="field font-mono" value={f.version} onChange={(e) => set("version", e.target.value)} /></Field>
          <Field label={`CVSS score: ${f.cvss.toFixed(1)}`}>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={10} step={0.1} value={f.cvss} onChange={(e) => set("cvss", Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <SevBadge s={classify(f.cvss)} />
            </div>
          </Field>
          <Field label="Discovery date"><input type="date" className="field" value={f.discovered} onChange={(e) => set("discovered", e.target.value)} /></Field>
          <Field label="Exposure">
            <select className="field" value={f.exposure} onChange={(e) => set("exposure", e.target.value as Finding["exposure"])}>
              <option>Internal</option><option>Internet-facing</option>
            </select>
          </Field>
          <Field label="Exploit availability">
            <select className="field" value={f.exploitAvailable} onChange={(e) => set("exploitAvailable", e.target.value as Finding["exploitAvailable"])}>
              <option>None known</option><option>Public PoC</option><option>Actively exploited</option>
            </select>
          </Field>
          <Field label="Business impact">
            <select className="field" value={f.businessImpact} onChange={(e) => set("businessImpact", e.target.value as Level)}>
              {LEVELS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Remediation due date"><input type="date" className="field" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          <Field label="Evidence" className="sm:col-span-2"><textarea rows={3} className="field font-mono text-xs" placeholder="Scanner output, version banner, config excerpt…" value={f.evidence} onChange={(e) => set("evidence", e.target.value)} /></Field>
          <Field label="Potential impact" className="sm:col-span-2"><textarea rows={2} className="field" value={f.impact} onChange={(e) => set("impact", e.target.value)} /></Field>
          <Field label="Recommended remediation" className="sm:col-span-2"><textarea rows={2} className="field" value={f.remediation} onChange={(e) => set("remediation", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Button type="submit" className="w-full">Save finding</Button></div>
        </div>
        <div className="space-y-4">
          <CvePanel
            cve={f.cve}
            onApply={(i) => setF((p) => ({
              ...p,
              title: p.title || i.id,
              description: p.description || (i.description ?? ""),
              cvss: i.cvss ?? p.cvss,
              references: Array.from(new Set([...p.references, ...i.references])),
            }))}
          />
          <div className="panel space-y-2">
            <p className="font-semibold">Import findings (JSON)</p>
            <p className="text-xs text-muted-foreground">Array of objects with fields: cve, title, description, asset (name or host), software, version, cvss, evidence, discovered.</p>
            <textarea rows={6} className="field font-mono text-xs" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"title":"…","asset":"lab-web-01","cvss":6.5}]' />
            <Button type="button" variant="outline" className="w-full" onClick={doImport} disabled={!importText.trim()}>Import</Button>
          </div>
        </div>
      </form>
    </>
  );
}
