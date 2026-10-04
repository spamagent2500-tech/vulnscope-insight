import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupCve, type CveInfo } from "@/lib/cve.functions";

export function CvePanel({ cve, onApply }: { cve: string; onApply?: (i: CveInfo) => void }) {
  const fn = useServerFn(lookupCve);
  const [info, setInfo] = useState<CveInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = /^CVE-\d{4}-\d{4,}$/i.test(cve.trim());

  const run = async () => {
    setLoading(true);
    try {
      setInfo(await fn({ data: { id: cve.trim() } }));
    } catch {
      setInfo({ found: false, id: cve, cvss: null, severity: null, vector: null, description: null, products: [], references: [], published: null, error: "Lookup failed" });
    }
    setLoading(false);
  };

  return (
    <div className="rounded border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CVE information · NVD</p>
        <Button type="button" size="sm" variant="outline" disabled={!valid || loading} onClick={run}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Look up
        </Button>
      </div>
      {!valid && <p className="mt-2 text-xs text-muted-foreground">Enter a CVE ID (e.g. CVE-2021-44228) to fetch official data.</p>}
      {info && !info.found && (
        <div className="mt-3 flex gap-2 rounded border border-sev-medium/40 bg-sev-medium/10 p-3 text-sm text-sev-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>External CVE data unavailable ({info.error}). All CVE details must be manually verified against an authoritative source.</span>
        </div>
      )}
      {info?.found && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div><span className="text-muted-foreground">ID</span><p>{info.id}</p></div>
            <div><span className="text-muted-foreground">CVSS</span><p>{info.cvss ?? "n/a"}</p></div>
            <div><span className="text-muted-foreground">Severity</span><p>{info.severity ?? "n/a"}</p></div>
          </div>
          {info.vector && <p className="break-all font-mono text-[11px] text-muted-foreground">{info.vector}</p>}
          <p>{info.description}</p>
          {info.products.length > 0 && (
            <div><p className="text-xs text-muted-foreground">Affected products</p><p className="text-xs">{info.products.join(" · ")}</p></div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">References & remediation advisories</p>
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-auto text-xs">
              {info.references.map((r) => <li key={r}><a href={r} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">{r}</a></li>)}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Remediation: consult the vendor advisories above for fixed versions. Verify applicability to your environment.</p>
          {onApply && <Button type="button" size="sm" onClick={() => onApply(info)}>Apply to finding</Button>}
        </div>
      )}
    </div>
  );
}
