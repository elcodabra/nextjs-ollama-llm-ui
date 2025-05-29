// import { createOllama } from 'ollama-ai-provider';
import {
  convertToCoreMessages,
  UserContent, generateText,
} from 'ai';
import {Message} from "ai/react";
import {NextResponse} from "next/server";
import { openai } from '@ai-sdk/openai';

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, selectedModel, data, temperature, maxTokens } = await req.json();

  // const [model, server] = selectedModel?.split(' ') || [process.env.NEXT_PUBLIC_MODEL_NAME, 0]

  // const ollamaUrl = (process.env.OLLAMA_URLS?.split(',') || [])[server];
  // console.log('OLLAMA_URL:', ollamaUrl);

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  console.log('messages = ', messages);

  const recentMessages = initialMessages.filter(({ role }: Message) => role !== 'system').slice(0, -5);
  let sumMessages;
  console.log('Recent messages length:', recentMessages.length);
  if (recentMessages.length >= 5) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000'}/api/chat/sum`, {
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

  // const ollama = createOllama({baseURL: ollamaUrl + "/api"});

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

  // console.log('model = ', model);

  const messagesList = [
    ...(process.env.NEXT_PUBLIC_SYSTEM_PROMPT ? [{ role: 'system', content: process.env.NEXT_PUBLIC_SYSTEM_PROMPT }] : []),
    ...convertToCoreMessages([
      ...initialMessages.slice(0, initialMessages.length - recentMessages.length),
      ...(sumMessages || recentMessages),
    ]),
    { role: 'user', content: currentMessage.content },
  ]

  console.log('messagesList = ', JSON.stringify(messagesList, null, 2));

  // https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
  // https://github.com/vercel/ai/issues/4700
  // https://community.vercel.com/t/streamtext-tool-invocation-failure/7701
  // Stream text using the ollama model
  const result = await generateText({
    // model: ollama(model),
    model: openai('gpt-4.1-mini'),
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
    maxSteps: 2,
  });

  return NextResponse.json(result);
}
