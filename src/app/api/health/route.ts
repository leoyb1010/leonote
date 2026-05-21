import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "missing_database_url",
        message: "DATABASE_URL is required before Leonote can read or write notes.",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        db: "disconnected",
        message: error instanceof Error ? error.message : "Database connection failed.",
      },
      { status: 503 },
    );
  }
}
