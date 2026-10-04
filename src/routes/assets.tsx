import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions, today, uid, useStore, type Asset, type Environment, type Level, LEVELS } from "@/lib/store";
import { Field, PageHeader } from "@/components/vs";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets — VulnScope" },
      { name: "description", content: "Register and manage authorized assets in assessment scope." },
      { property: "og:title", content: "Assets — VulnScope" },
      { property: "og:description", content: "Register and manage authorized assets in assessment scope." },
    ],
  }),
  component: AssetsPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  host: z.string().trim().min(1, "IP/hostname required").max(255).regex(/^[a-zA-Z0-9.:\-_]+$/, "Invalid IP or hostname"),
  os: z.string().trim().max(100),
  type: z.string().trim().max(100),
  owner: z.string().trim().max(100),
  authorized: z.literal(true, { errorMap: () => ({ message: "You must confirm authorization" }) }),
});

const blank = (): Asset => ({ id: "", name: "", host: "", os: "", type: "", owner: "", environment: "Lab", importance: "Medium", lastAssessed: today(), authorized: false, createdAt: today() });

function AssetsPage() {
  const { assets, findings } = useStore();
  const [form, setForm] = useState<Asset>(blank());
  const set = <K extends keyof Asset>(k: K, v: Asset[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Invalid input"); return; }
    actions.saveAsset({ ...form, id: form.id || uid() });
    toast.success(form.id ? "Asset updated" : "Asset added");
    setForm(blank());
  };

  return (
    <>
      <PageHeader title="Authorized Assets" sub="Only analyze systems you own or have written permission to assess." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="panel space-y-3 self-start">
          <p className="font-semibold">{form.id ? "Edit asset" : "New asset"}</p>
          <Field label="Asset name"><input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="IP address / hostname"><input className="field font-mono" value={form.host} onChange={(e) => set("host", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Operating system"><input className="field" value={form.os} onChange={(e) => set("os", e.target.value)} /></Field>
            <Field label="Asset type"><input className="field" placeholder="Web server" value={form.type} onChange={(e) => set("type", e.target.value)} /></Field>
            <Field label="Owner"><input className="field" value={form.owner} onChange={(e) => set("owner", e.target.value)} /></Field>
            <Field label="Environment">
              <select className="field" value={form.environment} onChange={(e) => set("environment", e.target.value as Environment)}>
                {["Lab", "Development", "Production"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Importance">
              <select className="field" value={form.importance} onChange={(e) => set("importance", e.target.value as Level)}>
                {LEVELS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Last assessed"><input type="date" className="field" value={form.lastAssessed} onChange={(e) => set("lastAssessed", e.target.value)} /></Field>
          </div>
          <label className="flex items-start gap-2 rounded border border-primary/40 bg-primary/5 p-3 text-sm">
            <input type="checkbox" className="mt-1 accent-[var(--primary)]" checked={form.authorized} onChange={(e) => set("authorized", e.target.checked)} />
            <span>I confirm I am authorized by the asset owner to perform security analysis on this asset.</span>
          </label>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">{form.id ? "Save changes" : "Add asset"}</Button>
            {form.id && <Button type="button" variant="outline" onClick={() => setForm(blank())}>Cancel</Button>}
          </div>
        </form>

        <div className="panel overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>{["Asset", "Host", "OS", "Type", "Owner", "Env", "Last assessed", "Findings", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40">
                  <td className="p-3 font-medium"><span className="flex items-center gap-1">{a.authorized && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}{a.name}</span></td>
                  <td className="p-3 font-mono text-xs">{a.host}</td>
                  <td className="p-3">{a.os}</td>
                  <td className="p-3">{a.type}</td>
                  <td className="p-3">{a.owner}</td>
                  <td className="p-3"><span className={a.environment === "Production" ? "text-sev-high" : "text-muted-foreground"}>{a.environment}</span></td>
                  <td className="p-3 font-mono text-xs">{a.lastAssessed}</td>
                  <td className="p-3 font-mono">{findings.filter((f) => f.assetId === a.id).length}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setForm(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Delete ${a.name} and its findings?`) && actions.deleteAsset(a.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!assets.length && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No assets yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
