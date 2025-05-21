import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const res = await Promise.allSettled((process.env.OLLAMA_URLS?.split(',') || []).map((OLLAMA_URL, idx) => {
    console.log('OLLAMA_URL:', OLLAMA_URL);
    return fetch(OLLAMA_URL + "/api/tags").then((res) => res.json()).then((r) => {
      // @ts-ignore
      return { models: r.models.map((m) => ({ ...m, server: idx })) }
    });
  })).then((results) => {
    // @ts-ignore
    return results.filter((result) => result.status === 'fulfilled').reduce((acc, c) => [...acc, ...(c.value.models || [])], []);
  });

  // console.log(res);
  // return new Response(res.body, res);
  return NextResponse.json({ models: res });
}
