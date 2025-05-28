import { createOllama } from 'ollama-ai-provider';
import {
  streamText,
  convertToCoreMessages,
  UserContent,
} from 'ai';
import {Message} from "ai/react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

export async function POST(req: Request) {
  // Destructure request data
  const { messages, selectedModel, data, temperature, maxTokens } = await req.json();

  const [model, server] = selectedModel.split(' ')

  const ollamaUrl = (process.env.OLLAMA_URLS?.split(',') || [])[server];
  console.log('OLLAMA_URL:', ollamaUrl);

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const recentMessages = initialMessages.filter(({ role }: Message) => role !== 'system').slice(0, -5);
  let sumMessages;
  console.log('Recent messages length:', recentMessages.length);
  if (recentMessages.length >= 5) {
    const res = await fetch(`${process.env.NEXT_HOST || 'http://localhost:3000'}/api/chat/sum`, {
      method: 'POST',
      body: JSON.stringify({
        selectedModel: 'tinyllama:latest',
        messages: recentMessages,
      }),
    }).then(res => res.json());

    console.log('chat/sum result = ', res);
    if (res.text) {
      sumMessages = [{role: 'system', content: `Summary of the conversation so far: ${res.text}`}]
    }
  }

  const ollama = createOllama({baseURL: ollamaUrl + "/api"});

  // Build message content array directly
  const messageContent: UserContent = [{ type: 'text', text: currentMessage.content }];

  // Add images if they exist
  data?.images?.forEach((imageUrl: string) => {
    // const image = new URL(imageUrl);
    messageContent.push({ type: 'image', image: imageUrl });
    /*
    messageContent.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    });
    */
  });

  // TODO: Add documents if they exist
  data?.documents?.forEach((documentUrl: string) => {
    // const data = new URL(documentUrl);
    messageContent.push({ type: 'file', data: documentUrl, mimeType: 'application/pdf' });
  });

  console.log('model = ', selectedModel);

  const messagesList = [
    ...(process.env.SYSTEM_PROMPT ? [{ role: 'system', content: process.env.SYSTEM_PROMPT }] : []),
    ...(process.env.USER_PROMPT ? [{ role: 'system', content: process.env.USER_PROMPT }] : []),
    // { role: 'system', content: 'You are a chat companion who talks like a close friend. Keep it casual, warm, and real — no assistant behavior, no help offers, no robotic phrasing. Keep replies short and natural, like a quick text or voice message in a chat. Be present, curious, and a little playful when it fits. You’re here to hang out, not solve things.' },
    // { role: 'system', content: 'Ты дружелюбный чат-бот, который общается как хороший друг. Говори по-простому, тепло, без официальности. Не предлагай помощь, не веди себя как ассистент. Отвечай коротко, естественно — как будто переписываешься в чате. Можно с ноткой юмора или лёгкой иронии, если подходит.' },
    ...convertToCoreMessages([
      ...initialMessages.slice(0, initialMessages.length - recentMessages.length),
      ...(sumMessages || recentMessages),
    ]),
    { role: 'user', content: messageContent },
  ]

  console.log('messagesList = ', messagesList);

  // https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
  // https://github.com/vercel/ai/issues/4700
  // https://community.vercel.com/t/streamtext-tool-invocation-failure/7701
  // Stream text using the ollama model
  const result = await streamText({
    model: ollama(model),
    ...(temperature ? { temperature } : {}),
    ...(maxTokens ? { maxTokens } : {}),
    messages: messagesList,
    onChunk({ chunk }) {
      // console.log('onChunk = ', chunk);
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
    },
    onFinish() {
      console.log('onFinish');
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}
