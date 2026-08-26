import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/guards";

// Root route never renders content itself — it routes based on a
// server-verified session. No role is ever trusted from the client.
export default async function RootPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  redirect(session.role === "ADMIN" ? "/admin" : "/team");
}
