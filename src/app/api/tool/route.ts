import { createOllama } from 'ollama-ai-provider';
import { generateText } from 'ai';
import { NextResponse } from "next/server";
import { createBooking, getAvailableSlots, weatherTool, giveRelevanceScore, retrieverTool } from '@/lib/tools';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// https://python.langchain.com/docs/integrations/chat/ollama/
// https://chatgpt.com/c/680115e6-9b78-8013-adc9-26c3d5cba47b
export async function POST(req: Request) {
  const { messages } = await req.json();

  const OLLAMA_URL = process.env.OLLAMA_URL;
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);

  const ollama = createOllama({baseURL: OLLAMA_URL + "/api"});

  const result = await generateText({
    model: ollama('llama3.1:latest'),
    // model: ollama('yandex/YandexGPT-5-Lite-8B-instruct-GGUF:latest'),
    tools: {
      weather: weatherTool,
      available_slots: getAvailableSlots,
      create_booking: createBooking,
      give_relevance_score: giveRelevanceScore,
      retriever_tool: retrieverTool,
    },
    maxSteps: 5,
    onError({ error }) {
      console.error('Error = ', error); // your error logging logic here
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
    },
    // prompt: 'What is the weather in San Francisco?',
    // TODO: get slots
    messages: messages || [{ role: 'user', content: 'I want to get info about Spain visa. Return pageUrl' }],
    // messages: [{ role: 'user', content: 'I want to book for Ivan ivan@test.ru 2025-04-21T12:00:00.000Z to 2025-04-21T12:30:00.000Z for Berlin timezone' }],
  });

  return NextResponse.json(result);
}
