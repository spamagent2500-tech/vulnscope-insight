import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { classify, computeRisk, isClosed, SEVERITIES, STATUSES, useStore } from "@/lib/store";
import { PageHeader, SevBadge, sevText } from "@/components/vs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — VulnScope" },
      { name: "description", content: "Security operations overview: vulnerabilities by severity, risk score and remediation progress." },
      { property: "og:title", content: "Dashboard — VulnScope" },
      { property: "og:description", content: "Security operations overview: vulnerabilities by severity, risk score and remediation progress." },
    ],
  }),
  component: Dashboard,
});

const sevColor: Record<string, string> = {
  Critical: "var(--sev-critical)",
  High: "var(--sev-high)",
  Medium: "var(--sev-medium)",
  Low: "var(--sev-low)",
  Informational: "var(--sev-info)",
};

function Dashboard() {
  const { assets, findings } = useStore();
  const amap = new Map(assets.map((a) => [a.id, a]));
  const count = (s: string) => findings.filter((f) => classify(f.cvss) === s).length;
  const open = findings.filter((f) => !isClosed(f.status));
  const closed = findings.length - open.length;
  const progress = findings.length ? Math.round((closed / findings.length) * 100) : 0;
  const risks = open.map((f) => computeRisk(f, amap.get(f.assetId)).score);
  const riskScore = risks.length ? Math.round((Math.max(...risks) * 0.5 + (risks.reduce((a, b) => a + b, 0) / risks.length) * 0.5) * 10) / 10 : 0;
  const recent = [...findings].sort((a, b) => b.discovered.localeCompare(a.discovered)).slice(0, 6);
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const recentCount = findings.filter((f) => f.discovered >= since).length;

  const sevData = SEVERITIES.map((s) => ({ name: s, value: count(s) }));
  const statusData = STATUSES.map((s) => ({ name: s.replace("Remediation in Progress", "In progress"), value: findings.filter((f) => f.status === s).length }));
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { d: d.slice(5), n: findings.filter((f) => f.discovered === d).length };
  });

  const stats = [
    ["Assets analyzed", assets.length, "text-foreground"],
    ["Total vulnerabilities", findings.length, "text-foreground"],
    ["Critical", count("Critical"), sevText.Critical],
    ["High", count("High"), sevText.High],
    ["Medium", count("Medium"), sevText.Medium],
    ["Low", count("Low"), sevText.Low],
    ["Found last 7 days", recentCount, "text-primary"],
  ] as const;

  return (
    <>
      <PageHeader title="Security Operations Overview" sub="Live posture across all authorized assets." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map(([l, v, c]) => (
          <div key={l} className="panel !p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className={`mt-2 font-mono text-3xl font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Overall risk score</p>
          <div className="mt-4 flex items-end gap-3">
            <span className={`font-mono text-6xl font-semibold ${sevText[classify(riskScore)]}`}>{riskScore.toFixed(1)}</span>
            <span className="mb-2 text-muted-foreground">/ 10</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
            <div className="h-full bg-gradient-to-r from-sev-low via-sev-high to-sev-critical" style={{ width: `${riskScore * 10}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Blend of the highest and average contextual risk of open findings.</p>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">Remediation progress</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-sm text-primary">{progress}%</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{closed} of {findings.length} findings closed</p>
        </div>

        <div className="panel">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Severity distribution</p>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sevData} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {sevData.map((d) => <Cell key={d.name} fill={sevColor[d.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {sevData.map((d) => (
              <span key={d.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: sevColor[d.name] }} />{d.name} {d.value}</span>
            ))}
          </div>
        </div>

        <div className="panel">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Remediation status</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={statusData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="panel lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Discoveries — last 14 days</p>
          <div className="mt-2 h-48">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <XAxis dataKey="d" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis allowDecimals={false} width={24} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Area dataKey="n" name="Findings" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel lg:col-span-3">
          <div className="mb-3 flex justify-between">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Recently discovered</p>
            <Link to="/findings" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((f) => (
              <li key={f.id}>
                <Link to="/findings/$id" params={{ id: f.id }} className="flex items-center gap-3 py-2 hover:text-primary">
                  <SevBadge s={classify(f.cvss)} />
                  <span className="flex-1 truncate text-sm">{f.title}</span>
                  <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{amap.get(f.assetId)?.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{f.discovered}</span>
                </Link>
              </li>
            ))}
            {!recent.length && <li className="py-4 text-sm text-muted-foreground">No findings yet.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
