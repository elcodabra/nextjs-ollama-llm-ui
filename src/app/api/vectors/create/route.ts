import { NextRequest, NextResponse } from 'next/server';
import { generative, vectorizer } from 'weaviate-client';
import { getClient } from '@/lib/weaviate-client';

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
  await client.collections.create({
    name: name,
    vectorizers: vectorizer.text2VecOllama({              // Configure the Ollama embedding integration
      apiEndpoint: 'http://host.docker.internal:11434',   // Allow Weaviate from within a Docker container to contact your Ollama instance
      model: 'nomic-embed-text',                          // The model to use
    }),
    generative: generative.ollama({                       // Configure the Ollama generative integration
      apiEndpoint: 'http://host.docker.internal:11434',   // Allow Weaviate from within a Docker container to contact your Ollama instance
      model: modelName,                           // The model to use
    }),
  });

  return NextResponse.json({ status: 'ok', name });
}
