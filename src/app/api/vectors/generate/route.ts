import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/weaviate-client';
import { getClassName } from '@/lib/utils';

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  const task = req.nextUrl.searchParams.get("task") || 'Write a tweet with emojis about these facts and add link.';
  const prompt = req.nextUrl.searchParams.get("prompt");
  const name = req.nextUrl.searchParams.get("name");

  if (!name || !query) {
    return NextResponse.json({ status: 'error', message: 'No name or query' });
  }

  const client = await getClient();
  const questions = client.collections.get(getClassName(name));

  const data = await questions.generate.nearText(
    query || 'biology',
    {
      ...(prompt ? { singlePrompt: prompt } : {}),
      ...(task ? { groupedTask: task } : {}),
    },
    {
      targetVector: [/*'text_vector', */'title_vector', 'section_vector'],
      limit: 3,
    }
  );

  return NextResponse.json({ status: 'ok', data });
}
