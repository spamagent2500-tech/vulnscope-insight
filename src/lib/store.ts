import { useSyncExternalStore } from "react";

export type Environment = "Lab" | "Development" | "Production";
export type Severity = "Critical" | "High" | "Medium" | "Low" | "Informational";
export type Status =
  | "Open"
  | "Investigating"
  | "Remediation in Progress"
  | "Resolved"
  | "Accepted Risk"
  | "False Positive";
export type Level = "Low" | "Medium" | "High";

export const STATUSES: Status[] = [
  "Open",
  "Investigating",
  "Remediation in Progress",
  "Resolved",
  "Accepted Risk",
  "False Positive",
];
export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
export const LEVELS: Level[] = ["Low", "Medium", "High"];

export interface Asset {
  id: string;
  name: string;
  host: string;
  os: string;
  type: string;
  owner: string;
  environment: Environment;
  importance: Level;
  lastAssessed: string;
  authorized: boolean;
  createdAt: string;
}

export interface Note {
  at: string;
  text: string;
}

export interface Finding {
  id: string;
  cve: string;
  title: string;
  description: string;
  assetId: string;
  software: string;
  version: string;
  cvss: number;
  evidence: string;
  discovered: string;
  exposure: "Internal" | "Internet-facing";
  exploitAvailable: "None known" | "Public PoC" | "Actively exploited";
  businessImpact: Level;
  impact: string;
  remediation: string;
  references: string[];
  status: Status;
  verified: boolean;
  dueDate: string;
  notes: Note[];
}

export interface Scope {
  name: string;
  assessor: string;
  scope: string;
}

interface State {
  assets: Asset[];
  findings: Finding[];
  scope: Scope;
}

export function classify(cvss: number): Severity {
  if (cvss >= 9) return "Critical";
  if (cvss >= 7) return "High";
  if (cvss >= 4) return "Medium";
  if (cvss > 0) return "Low";
  return "Informational";
}

const lv = (l: Level) => (l === "High" ? 1 : l === "Medium" ? 0.6 : 0.3);

export interface RiskResult {
  score: number;
  rating: Severity;
  factors: { label: string; value: string; effect: string }[];
}

export function computeRisk(f: Finding, asset?: Asset): RiskResult {
  const importance = asset?.importance ?? "Medium";
  const envW = asset?.environment === "Production" ? 1 : asset?.environment === "Development" ? 0.7 : 0.5;
  const exp = f.exposure === "Internet-facing" ? 1 : 0.6;
  const exploit = f.exploitAvailable === "Actively exploited" ? 1 : f.exploitAvailable === "Public PoC" ? 0.8 : 0.5;
  const contextual = (lv(importance) + envW + exp + exploit + lv(f.businessImpact)) / 5;
  const score = Math.round(Math.min(10, f.cvss * (0.5 + contextual * 0.6)) * 10) / 10;
  return {
    score,
    rating: classify(score),
    factors: [
      { label: "CVSS base", value: f.cvss.toFixed(1), effect: `${classify(f.cvss)} technical severity is the starting point.` },
      { label: "Asset importance", value: importance, effect: importance === "High" ? "Critical asset raises risk." : "Lower importance tempers risk." },
      { label: "Environment", value: asset?.environment ?? "Unknown", effect: envW === 1 ? "Production systems carry real business exposure." : "Non-production lowers real-world impact." },
      { label: "Exposure", value: f.exposure, effect: exp === 1 ? "Reachable from the internet — wider attacker pool." : "Internal only — requires network foothold." },
      { label: "Exploit availability", value: f.exploitAvailable, effect: exploit === 1 ? "Known active exploitation sharply raises urgency." : exploit === 0.8 ? "Public proof-of-concept exists." : "No known public exploit." },
      { label: "Business impact", value: f.businessImpact, effect: `${f.businessImpact} impact if compromised.` },
    ],
  };
}

const KEY = "vulnscope:v1";
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
export const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): State {
  const assets: Asset[] = [
    { id: "a1", name: "lab-web-01", host: "10.10.0.21", os: "Ubuntu 22.04", type: "Web server", owner: "Security Lab", environment: "Lab", importance: "Medium", lastAssessed: daysAgo(2), authorized: true, createdAt: daysAgo(30) },
    { id: "a2", name: "dev-app-02", host: "dev-app-02.internal", os: "Windows Server 2016", type: "Application server", owner: "Platform Team", environment: "Development", importance: "High", lastAssessed: daysAgo(5), authorized: true, createdAt: daysAgo(25) },
    { id: "a3", name: "lab-vpn-gw", host: "10.10.0.1", os: "Debian 12", type: "Network appliance", owner: "Security Lab", environment: "Lab", importance: "High", lastAssessed: daysAgo(1), authorized: true, createdAt: daysAgo(20) },
  ];
  const base = { evidence: "", impact: "", references: [] as string[], verified: false, notes: [] as Note[], businessImpact: "Medium" as Level, exposure: "Internal" as const };
  const findings: Finding[] = [
    { ...base, id: "f1", cve: "CVE-2021-44228", title: "Apache Log4j2 JNDI remote code execution (Log4Shell)", description: "Apache Log4j2 JNDI features do not protect against attacker-controlled LDAP and other JNDI endpoints, allowing remote code execution when message lookup substitution is enabled.", assetId: "a1", software: "Apache Log4j2", version: "2.14.1", cvss: 10, evidence: "Scanner banner/version detection reported log4j-core-2.14.1.jar in application lib directory.", discovered: daysAgo(3), exploitAvailable: "Actively exploited", impact: "Full compromise of the application host if exploited.", remediation: "Upgrade Log4j2 to a fixed release per the Apache advisory; verify all bundled copies are updated.", references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228", "https://logging.apache.org/log4j/2.x/security.html"], status: "Remediation in Progress", dueDate: daysAgo(-4), verified: true },
    { ...base, id: "f2", cve: "CVE-2017-0144", title: "Microsoft SMBv1 remote code execution", description: "The SMBv1 server in affected Microsoft Windows versions allows remote attackers to execute arbitrary code via crafted packets.", assetId: "a2", software: "Windows SMBv1", version: "Unpatched (MS17-010 missing)", cvss: 8.1, discovered: daysAgo(6), exploitAvailable: "Actively exploited", businessImpact: "High", impact: "Remote code execution and lateral movement.", remediation: "Apply Microsoft security update MS17-010 and disable SMBv1.", references: ["https://nvd.nist.gov/vuln/detail/CVE-2017-0144"], status: "Open", dueDate: daysAgo(-2) },
    { ...base, id: "f3", cve: "CVE-2014-0160", title: "OpenSSL TLS heartbeat information disclosure (Heartbleed)", description: "The TLS heartbeat extension in affected OpenSSL 1.0.1 versions does not properly handle packets, allowing remote attackers to read process memory.", assetId: "a3", software: "OpenSSL", version: "1.0.1f", cvss: 7.5, discovered: daysAgo(10), exposure: "Internet-facing", exploitAvailable: "Public PoC", impact: "Disclosure of memory contents, potentially including keys and credentials.", remediation: "Upgrade OpenSSL to a fixed version, then rotate keys and certificates.", references: ["https://nvd.nist.gov/vuln/detail/CVE-2014-0160"], status: "Resolved", dueDate: daysAgo(2), verified: true },
    { ...base, id: "f4", cve: "", title: "TLS 1.0 protocol enabled", description: "The service accepts connections using the deprecated TLS 1.0 protocol.", assetId: "a1", software: "nginx", version: "1.18.0", cvss: 4.3, discovered: daysAgo(2), exploitAvailable: "None known", businessImpact: "Low", evidence: "TLS handshake accepted with TLSv1.0.", impact: "Weakened transport confidentiality.", remediation: "Disable TLS 1.0/1.1 in the server configuration; allow TLS 1.2+ only.", status: "Investigating", dueDate: daysAgo(-14) },
    { ...base, id: "f5", cve: "", title: "Server version disclosure in HTTP headers", description: "HTTP response headers reveal the exact web server version.", assetId: "a1", software: "nginx", version: "1.18.0", cvss: 0, discovered: daysAgo(1), exploitAvailable: "None known", businessImpact: "Low", impact: "Aids reconnaissance.", remediation: "Set server_tokens off.", status: "Open", dueDate: "" },
  ];
  return { assets, findings, scope: { name: "Q4 Lab Security Assessment", assessor: "", scope: "Authorized lab and development hosts listed under Assets." } };
}

let state: State | null = null;
const listeners = new Set<() => void>();
function load(): State {
  if (state) return state;
  if (typeof window === "undefined") return (state = seed());
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seed();
  } catch {
    state = seed();
  }
  return state!;
}
const serverSnap = seed();

export function setState(fn: (s: State) => State) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => serverSnap,
  );
}

export const actions = {
  saveAsset: (a: Asset) =>
    setState((s) => ({ ...s, assets: s.assets.some((x) => x.id === a.id) ? s.assets.map((x) => (x.id === a.id ? a : x)) : [...s.assets, a] })),
  deleteAsset: (id: string) => setState((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id), findings: s.findings.filter((f) => f.assetId !== id) })),
  saveFinding: (f: Finding) =>
    setState((s) => ({ ...s, findings: s.findings.some((x) => x.id === f.id) ? s.findings.map((x) => (x.id === f.id ? f : x)) : [f, ...s.findings] })),
  updateFinding: (id: string, patch: Partial<Finding>) =>
    setState((s) => ({ ...s, findings: s.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
  deleteFinding: (id: string) => setState((s) => ({ ...s, findings: s.findings.filter((f) => f.id !== id) })),
  setScope: (scope: Scope) => setState((s) => ({ ...s, scope })),
  reset: () => setState(() => seed()),
};

export { today };
export const isClosed = (s: Status) => s === "Resolved" || s === "Accepted Risk" || s === "False Positive";
