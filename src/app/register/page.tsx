import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/guards";
import { RegisterTeamForm } from "@/components/auth/RegisterTeamForm";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/team");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-950">Register a team</h1>
        <p className="mt-1 text-sm text-brand-700">
          Choose a team name and a team code — no password needed.
          Remember your team code well: it is the only key to your
          team&apos;s access.
        </p>
      </div>
      <RegisterTeamForm />
      <p className="text-sm text-brand-700">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-800 hover:underline">
          Go to sign in →
        </Link>
      </p>
    </main>
  );
}
