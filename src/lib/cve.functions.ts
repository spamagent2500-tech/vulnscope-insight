import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface CveInfo {
  found: boolean;
  id: string;
  cvss: number | null;
  severity: string | null;
  vector: string | null;
  description: string | null;
  products: string[];
  references: string[];
  published: string | null;
  error?: string;
}

export const lookupCve = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().trim().regex(/^CVE-\d{4}-\d{4,}$/i) }).parse(d))
  .handler(async ({ data }): Promise<CveInfo> => {
    const id = data.id.toUpperCase();
    const empty: CveInfo = { found: false, id, cvss: null, severity: null, vector: null, description: null, products: [], references: [], published: null };
    try {
      const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id)}`, {
        headers: { "User-Agent": "VulnScope" },
      });
      if (!res.ok) return { ...empty, error: `NVD responded with ${res.status}` };
      const json = (await res.json()) as any;
      const cve = json?.vulnerabilities?.[0]?.cve;
      if (!cve) return { ...empty, error: "CVE not found in NVD" };
      const m = cve.metrics ?? {};
      const metric = m.cvssMetricV31?.[0] ?? m.cvssMetricV30?.[0] ?? m.cvssMetricV2?.[0];
      const products = new Set<string>();
      for (const c of cve.configurations ?? [])
        for (const n of c.nodes ?? [])
          for (const mm of n.cpeMatch ?? []) {
            if (!mm.vulnerable) continue;
            const p = String(mm.criteria).split(":");
            products.add(`${p[3]} ${p[4]}${p[5] && p[5] !== "*" ? " " + p[5] : ""}`.replace(/_/g, " "));
          }
      return {
        found: true,
        id,
        cvss: metric?.cvssData?.baseScore ?? null,
        severity: metric?.cvssData?.baseSeverity ?? metric?.baseSeverity ?? null,
        vector: metric?.cvssData?.vectorString ?? null,
        description: cve.descriptions?.find((d: any) => d.lang === "en")?.value ?? null,
        products: [...products].slice(0, 25),
        references: (cve.references ?? []).map((r: any) => r.url).slice(0, 15),
        published: cve.published ?? null,
      };
    } catch (e) {
      return { ...empty, error: e instanceof Error ? e.message : "Lookup failed" };
    }
  });
