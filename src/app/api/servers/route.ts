import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ servers: process.env.OLLAMA_URLS?.split(',').map((_, idx) => `Server ${idx + 1}`) || [] });
}
