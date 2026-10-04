import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { LayoutDashboard, Server, Bug, FileText, ShieldHalf, PlusSquare } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  ["/", "Dashboard", LayoutDashboard],
  ["/assets", "Assets", Server],
  ["/findings", "Findings", Bug],
  ["/findings/new", "Add finding", PlusSquare],
  ["/reports", "Reports", FileText],
] as const;
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VulnScope — Vulnerability Analysis" },
      { name: "description", content: "Authorized vulnerability analysis, risk scoring and remediation tracking." },
      { property: "og:title", content: "VulnScope — Vulnerability Analysis" },
      { property: "og:description", content: "Authorized vulnerability analysis, risk scoring and remediation tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex print:hidden">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <ShieldHalf className="h-6 w-6 text-primary" />
            <span className="font-mono text-lg font-semibold">Vuln<span className="text-primary">Scope</span></span>
          </Link>
          <nav className="space-y-1 text-sm">
            {NAV.map(([to, label, Icon]) => (
              <Link key={to} to={to} activeOptions={{ exact: to === "/" }} className="flex items-center gap-2 rounded px-3 py-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground" activeProps={{ className: "bg-sidebar-accent text-primary" }}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto text-[11px] leading-relaxed text-muted-foreground">For authorized assessments, labs and education only. No exploitation is performed.</p>
        </aside>
        <div className="min-w-0 flex-1">
          <nav className="flex gap-3 overflow-x-auto border-b border-border p-3 text-sm md:hidden print:hidden">
            {NAV.map(([to, label]) => (
              <Link key={to} to={to} className="whitespace-nowrap text-muted-foreground" activeProps={{ className: "text-primary" }}>{label}</Link>
            ))}
          </nav>
          <main className="mx-auto max-w-7xl p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
