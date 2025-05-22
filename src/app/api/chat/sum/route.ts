import { createOllama } from 'ollama-ai-provider';
import { convertToCoreMessages, generateText, UserContent } from 'ai';
import { NextResponse } from 'next/server';
import { createBooking, getAvailableSlots, weatherTool } from '@/lib/tools';
import {parseInt} from "lodash";
import {Message} from "ai/react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const { messages, selectedModel } = await req.json();

  const OLLAMA_URL = process.env.OLLAMA_URL;
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);

  const ollama = createOllama({baseURL: OLLAMA_URL + "/api"});

  const prompt = `Summarize the following chat in 3 short sentences. Focus on the tone and relationship.\n\n` +
    // @ts-ignore
    messages.map((m: Message) => `${m.role}: ${typeof m.content === 'string' ? m.content : m.content?.[0]?.text || ''}`).join('\n');

  console.log('sum prompt = ', prompt);

  const result = await generateText({
    model: ollama(selectedModel),
    prompt,
  });

  return NextResponse.json({
    text: result.text,
    usage: result.usage,
    warnings: result.warnings,
  });
}
