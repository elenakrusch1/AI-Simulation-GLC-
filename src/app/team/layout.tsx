import { requireTeam } from "@/lib/auth/guards";
import { AppShell } from "@/components/layout/AppShell";

const TEAM_LINKS = [
  { href: "/team", label: "Dashboard" },
  { href: "/team/round-1", label: "Round 1" },
  { href: "/team/round-2", label: "Round 2" },
  { href: "/team/history", label: "History" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative, server-side check — every /team/** request is
  // verified here before any team content renders.
  const session = await requireTeam();

  return (
    <AppShell links={TEAM_LINKS} userLabel={session.teamName ?? session.loginIdentifier}>
      {children}
    </AppShell>
  );
}
