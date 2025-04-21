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
  await client.collections.create({
    name: getClassName(name),
    vectorizers: [
      weaviate.configure.vectorizer.text2VecOllama({
        name: 'text_vector',
        sourceProperties: ['text'],
        apiEndpoint: 'http://host.docker.internal:11434',  // If using Docker, use this to contact your local Ollama instance
        model: 'nomic-embed-text',  // or 'snowflake-arctic-embed'
      }),
    ],
    properties: [
      {
        name: 'text',
        dataType: dataType.TEXT,
      },
      {
        name: 'pageUrl',
        dataType: dataType.TEXT,
      },
      {
        name: 'pageTitle',
        dataType: dataType.TEXT,
      },
      {
        name: 'sectionTitle',
        dataType: dataType.TEXT,
      },
      {
        name: 'elementType',
        dataType: dataType.TEXT,
      },
      {
        name: 'position',
        dataType: dataType.INT,
      },
    ],
    generative: generative.ollama({                       // Configure the Ollama generative integration
      apiEndpoint: 'http://host.docker.internal:11434',   // Allow Weaviate from within a Docker container to contact your Ollama instance
      model: modelName,                           // The model to use
    }),
  });

  return NextResponse.json({ status: 'ok', name: getClassName(name) });
}
