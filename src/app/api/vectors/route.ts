import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/weaviate-client';
import { getClassName } from '@/lib/utils';

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

  const questions = client.collections.get(getClassName(name));

  const length = await questions.length();

  const data0 = await questions.query.nearText(query || 'biology', {
    targetVector: [/*'text_vector', */'title_vector', 'section_vector'],
    // distance: 0.7,
    limit: 3,
    // filters: questions.filter.byProperty('pageTitle').equal(query),
  });

  const data1 = await questions.query.bm25(query, {
    queryProperties: ['text', 'pageTitle^2', 'sectionTitle'],
    returnMetadata: ['score'],
    limit: 3,
    // returnProperties: ['pageUrl', 'pageTitle', 'sectionTitle', 'text'],
  })

  const data2 = await questions.query.hybrid(query, {
    targetVector: 'section_vector',
    // alpha: 0.25,
    returnMetadata: ['score', 'explainScore'],
    limit: 3,
  })

  return NextResponse.json({ status: 'ok', name: getClassName(name), length, data: [data0,data1,data2] });
}
