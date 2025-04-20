import { NextRequest, NextResponse } from 'next/server';
import weaviate, { generative, vectorizer } from 'weaviate-client';
import { getClient } from '@/lib/weaviate-client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const query = req.nextUrl.searchParams.get("query");

  if (!name || !query) {
    return NextResponse.json({ status: 'error', message: 'No name' });
  }

  const client = await getClient();

  const questions = client.collections.get(name);

  const data = await questions.query.nearText(query || 'biology', {
    limit: 2,
  });

  return NextResponse.json({ status: 'ok', name, data });
}
