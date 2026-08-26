import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/guards";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/team");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-brand-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-950">Data Center Deal Simulation</h1>
        <p className="mt-1 text-sm text-brand-700">Sign in to continue.</p>
      </div>
      <LoginForm />
    </main>
  );
}
