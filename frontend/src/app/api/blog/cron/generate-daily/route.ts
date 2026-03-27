import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CRON_SECRET = process.env.BLOG_CRON_SECRET || "";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API}/api/blog/cron/generate-daily`, {
      method: "POST",
      headers: { "x-cron-secret": CRON_SECRET },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "Failed to reach backend" },
      { status: 502 }
    );
  }
}
