import { NextRequest, NextResponse } from 'next/server';
import weaviate, {dataType, generative, vectorizer} from 'weaviate-client';
import { getClient } from '@/lib/weaviate-client';
import {getClassName} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ status: 'error', message: 'No name' });
  }

  const client = await getClient();

  // https://weaviate.io/developers/weaviate/model-providers/ollama/embeddings
  await client.collections.delete(getClassName(name));

  return NextResponse.json({ status: 'ok', name: getClassName(name) });
}
