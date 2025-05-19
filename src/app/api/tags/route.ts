import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const OLLAMA_URL = process.env.OLLAMA_URL;
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);
  const res = await fetch(
    OLLAMA_URL + "/api/tags"
  );
  const json = await res.json()
  // console.log(json);
  // return new Response(res.body, res);
  return NextResponse.json(json);
}
