import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never statically cache a health check.
export const dynamic = "force-dynamic";

// Public, unauthenticated health endpoint for the container platform
// (Docker HEALTHCHECK / Koyeb health checks). Keep this fast and side
// effect free; it verifies the app can reach the database but returns
// no application data.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", time: new Date().toISOString() },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: "error", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
