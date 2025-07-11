import { convertToCoreMessages, generateText, UserContent } from 'ai';
import { NextResponse } from 'next/server';
// import { createBooking, getAvailableSlots, weatherTool } from '@/lib/tools';
import {Message} from "ai/react";
import {openai} from "@ai-sdk/openai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const prompt = `Summarize the following chat in 3 short sentences. Focus on the tone and relationship.\n\n` +
    // @ts-ignore
    messages.map((m: Message) => `${m.role}: ${typeof m.content === 'string' ? m.content : m.content?.[0]?.text || ''}`).join('\n');

  console.log('sum prompt = ', prompt);

  const result = await generateText({
    model: openai('gpt-4o'),
    prompt,
  });

  return NextResponse.json({
    text: result.text,
    usage: result.usage,
    warnings: result.warnings,
  });
}
