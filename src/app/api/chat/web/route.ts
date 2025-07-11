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

  const [model, server] = selectedModel.split(' ')
  console.log('model = ', model);

  const OLLAMA_URL = process.env.OLLAMA_URL;
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL);

  const ollama = createOllama({baseURL: OLLAMA_URL + "/api"});

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  // console.log('data?.images = ', data?.images);
  const images = [];
  // Add images if they exist
  data?.images?.forEach((imageUrl: string) => {
    const image = new URL(imageUrl);
    images.push(image);
  });

  const prompt = `Ты умный веб-агент. На изображении находится веб-страница. Вот HTML этой страницы: \n\n ${currentMessage.content} \n\n Найди на изображении кнопку 'Оформить заказ' или 'Заказать'. Скажи, какой у неё CSS-селектор (если можно определить по HTML) или опиши её позицию на экране. Ответь в JSON:\n{\n"selector": "...", "position": { "x": ..., "y": ... }\n}`;
  console.log('prompt = ', prompt);

  const result = await generateText({
    model: ollama(model || 'llama3.1:latest'),
    // model: ollama('yandex/YandexGPT-5-Lite-8B-instruct-GGUF:latest'),
    /*
    tools: {
      // weather: weatherTool,
      available_slots: getAvailableSlots,
      create_booking: createBooking,
      get_currency_exchange_rates: getCurrencyExchangeRates,
    },
    */
    // ...(process.env.TEMPERATURE ? { temperature: parseFloat(process.env.TEMPERATURE) } : {}),
    // ...(process.env.MAX_TOKENS ? { maxTokens: parseInt(process.env.MAX_TOKENS) } : {}),
    maxSteps: 3,
    onError({ error }) {
      console.error('Error = ', error); // your error logging logic here
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
    },
    prompt,
    images,
  });

  return NextResponse.json(result);
}
