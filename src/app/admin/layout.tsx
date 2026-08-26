import { requireAdmin } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/rounds", label: "Rounds" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/scoring", label: "Scoring" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/audit-log", label: "Audit log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative, server-side check — every /admin/** request is
  // verified here before any admin content renders.
  const session = await requireAdmin();

  return (
    <AppShell links={ADMIN_LINKS} userLabel={session.loginIdentifier}>
      {children}
    </AppShell>
  );
}
