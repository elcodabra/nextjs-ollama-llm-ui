import { createOllama } from 'ollama-ai-provider';
import { convertToCoreMessages, generateText, UserContent } from 'ai';
import { NextResponse } from 'next/server';
import {createBooking, getAvailableSlots, getCurrencyExchangeRates, weatherTool} from '@/lib/tools';
import {parseInt} from "lodash";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// https://python.langchain.com/docs/integrations/chat/ollama/
// https://chatgpt.com/c/680115e6-9b78-8013-adc9-26c3d5cba47b
export async function POST(req: Request) {
  const { messages, selectedModel, data } = await req.json();

  const OLLAMA_URL = process.env.OLLAMA_URL;
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);

  const ollama = createOllama({baseURL: OLLAMA_URL + "/api"});

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  // Build message content array directly
  const messageContent: UserContent = [{ type: 'text', text: currentMessage.content }];

  // Add images if they exist
  data?.images?.forEach((imageUrl: string) => {
    const image = new URL(imageUrl);
    messageContent.push({ type: 'image', image });
  });

  const messagesList = [
    ...(process.env.SYSTEM_PROMPT ? [{ role: 'system', content: process.env.SYSTEM_PROMPT }] : []),
    ...(process.env.USER_PROMPT ? [{ role: 'system', content: process.env.USER_PROMPT }] : []),
    // { role: 'system', content: 'You are a chat companion who talks like a close friend. Keep it casual, warm, and real — no assistant behavior, no help offers, no robotic phrasing. Keep replies short and natural, like a quick text or voice message in a chat. Be present, curious, and a little playful when it fits. You’re here to hang out, not solve things.' },
    // { role: 'system', content: 'Ты дружелюбный чат-бот, который общается как хороший друг. Говори по-простому, тепло, без официальности. Не предлагай помощь, не веди себя как ассистент. Отвечай коротко, естественно — как будто переписываешься в чате. Можно с ноткой юмора или лёгкой иронии, если подходит.' },
    ...convertToCoreMessages(initialMessages),
    // ...initialMessages,
    { role: 'user', content: messageContent },
  ]

  const result = await generateText({
    model: ollama(selectedModel || 'llama3.1:latest'),
    // model: ollama('yandex/YandexGPT-5-Lite-8B-instruct-GGUF:latest'),
    tools: {
      // weather: weatherTool,
      available_slots: getAvailableSlots,
      create_booking: createBooking,
      get_currency_exchange_rates: getCurrencyExchangeRates,
    },
    ...(process.env.TEMPERATURE ? { temperature: parseFloat(process.env.TEMPERATURE) } : {}),
    ...(process.env.MAX_TOKENS ? { maxTokens: parseInt(process.env.MAX_TOKENS) } : {}),
    maxSteps: 5,
    onError({ error }) {
      console.error('Error = ', error); // your error logging logic here
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
    },
    // prompt: 'What is the weather in San Francisco?',
    // messages: messages || [{ role: 'user', content: 'I want to book for Ivan ivan@test.ru 2025-04-21T12:00:00.000Z to 2025-04-21T12:30:00.000Z for Berlin timezone' }],
    messages: messagesList,
  });

  return NextResponse.json(result);
}
