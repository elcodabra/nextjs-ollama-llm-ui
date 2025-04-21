import { NextRequest, NextResponse } from 'next/server';
import { WeaviateClient } from 'weaviate-client';
import { getClient } from '@/lib/weaviate-client';
import path from 'path';
import { promises as fs } from 'fs';
import {getClassName} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const modelName = process.env.MODEL_NAME;

// Load data
async function getJsonData(name: string) {
  try {
    // Construct the absolute path to the file in the root directory
    const filePath = path.join(process.cwd(), 'data', `${name}.json`);

    // Read the file contents
    const fileContents = await fs.readFile(filePath, 'utf8');

    // Parse the JSON
    const data = JSON.parse(fileContents);
    console.log('Loaded data length: ', data.length);

    return data;
  } catch (error) {
    console.error('Error reading JSON file:', error);
  }
}

// Note: The TS client does not have a `batch` method yet
// We use `insertMany` instead, which sends all of the data in one request
async function importQuestions(client: WeaviateClient, name: string): Promise<number> {
  const questions = client.collections.use(getClassName(name));
  const data = await getJsonData(name);
  const batchSize = 50;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const result = await questions.data.insertMany(batch);
    console.log('Insertion response: ', i + batchSize);
  }
  console.log('All data inserted in batches.', data.length);
  return data.length;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ status: 'error', message: 'No name' });
  }

  const client = await getClient();

  const length = await importQuestions(client, name);

  return NextResponse.json({ status: 'ok', name: getClassName(name), length });
}
