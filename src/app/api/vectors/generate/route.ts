import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/weaviate-client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  const task = req.nextUrl.searchParams.get("task");
  const name = req.nextUrl.searchParams.get("name");

  if (!name || !task || !query) {
    return NextResponse.json({ status: 'error', message: 'No name, task or query' });
  }

  const client = await getClient();
  const questions = client.collections.get(name);

  const data = await questions.generate.nearText(
    query || 'biology',
    {
      groupedTask: task || 'Write a tweet with emojis about these facts.',
    },
    {
      limit: 2,
    }
  );

  return NextResponse.json({ status: 'ok', data });
}
