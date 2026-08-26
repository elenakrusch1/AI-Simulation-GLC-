import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";

interface NavLink {
  href: string;
  label: string;
}

interface AppShellProps {
  links: NavLink[];
  userLabel: string;
  children: React.ReactNode;
}

// Shared corporate shell: dark blue top nav, white content area,
// responsive (link list wraps on small screens instead of overflowing).
export function AppShell({ links, userLabel, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-brand-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="text-lg font-bold tracking-tight">
              Data Center Deal Simulation
            </span>
            <nav aria-label="Primary" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-brand-100 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-brand-100">{userLabel}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-brand-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
