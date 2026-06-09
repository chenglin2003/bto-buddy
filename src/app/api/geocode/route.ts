import { NextResponse, type NextRequest } from "next/server";
import { geocode } from "@/lib/onemap";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "missing q" }, { status: 400 });
  }
  try {
    const result = await geocode(query);
    if (!result) {
      return NextResponse.json({ error: "no match" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "geocode failed" },
      { status: 500 },
    );
  }
}
