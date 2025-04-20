import { NextRequest, NextResponse } from 'next/server';
import { WeaviateClient } from 'weaviate-client';
import { getClient } from '@/lib/weaviate-client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

// Load data
async function getJsonData() {
  // TODO:
  const file = await fetch(
    'https://raw.githubusercontent.com/weaviate-tutorials/quickstart/main/data/jeopardy_tiny.json'
  );
  return file.json();
}

// Note: The TS client does not have a `batch` method yet
// We use `insertMany` instead, which sends all of the data in one request
async function importQuestions(client: WeaviateClient, name: string) {
  const questions = client.collections.get(name);
  const data = await getJsonData();
  const result = await questions.data.insertMany(data);
  console.log('Insertion response: ', result);
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ status: 'error', message: 'No name' });
  }

  const client = await getClient();

  await importQuestions(client, name);

  return NextResponse.json({ status: 'ok', name });
}
