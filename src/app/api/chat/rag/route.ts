import { createOllama } from 'ollama-ai-provider';
import {convertToCoreMessages, generateText, UserContent} from 'ai';
import { NextResponse } from "next/server";
import {
  createBooking,
  getAvailableSlots,
  weatherTool,
  giveRelevanceScore,
  getRetrieverTool
} from '@/lib/tools';

export const dynamic = "force-dynamic";
export const revalidate = 0;

// https://python.langchain.com/docs/integrations/chat/ollama/
// https://chatgpt.com/c/680115e6-9b78-8013-adc9-26c3d5cba47b
export async function POST(req: Request) {
  const { name, messages, selectedModel, data } = await req.json();

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
    /*
    {
      role: 'system',
      content: `
        You are a grader assessing relevance of a retrieved document to a user question.
        Here is the retrieved document:

        <document>
        {content}
        </document>

        Here is the user question:
        <question>
        {question}
        </question>

        If the document contains keywords related to the user question, grade it as relevant.
        It does not need to be a stringent test. The goal is to filter out erroneous retrievals.
        Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.
        Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.
      `,
    },
    */
    /*
    {
      role: 'system',
      content: `
      You are an assistant that can use tools.
      If you call a tool and receive a result, always include that result in your final message.
      Format your final answer clearly, ideally in JSON format, like this:
      {
        "tool_result": [THE TOOL RESULT HERE],
        "summary": "Optional human-readable summary of what you did"
      }
    `
    },
    */
    // { role: 'system', content: 'You are a chat companion who talks like a close friend. Keep it casual, warm, and real — no assistant behavior, no help offers, no robotic phrasing. Keep replies short and natural, like a quick text or voice message in a chat. Be present, curious, and a little playful when it fits. You’re here to hang out, not solve things.' },
    // { role: 'system', content: 'Ты дружелюбный чат-бот, который общается как хороший друг. Говори по-простому, тепло, без официальности. Не предлагай помощь, не веди себя как ассистент. Отвечай коротко, естественно — как будто переписываешься в чате. Можно с ноткой юмора или лёгкой иронии, если подходит.' },
    ...convertToCoreMessages(initialMessages),
    // ...initialMessages,
    { role: 'user', content: messageContent },
  ]
  // console.log('messagesList = ', messagesList);

  let extractedToolResult: any = null;

  const result = await generateText({
    model: ollama(selectedModel),
    // model: ollama('yandex/YandexGPT-5-Lite-8B-instruct-GGUF:latest'),
    tools: {
      weather: weatherTool,
      available_slots: getAvailableSlots,
      create_booking: createBooking,
      give_relevance_score: giveRelevanceScore,
      retriever_tool: getRetrieverTool(name),
    },
    maxSteps: 2,
    onError({ error }) {
      console.error('Error = ', error); // your error logging logic here
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
      if (toolCalls?.[0]?.toolName === 'retriever_tool' && toolResults?.[0]?.result) {
        extractedToolResult = toolResults?.[0]?.result;
      }
      // TODO: return
    },
    messages: messagesList,
    // messages: messages || [{ role: 'user', content: 'I want to get info about Spain visa. Return pageUrl' }],
    // messages: [{ role: 'user', content: 'I want to book for Ivan ivan@test.ru 2025-04-21T12:00:00.000Z to 2025-04-21T12:30:00.000Z for Berlin timezone' }],
  });

  console.log('extractedToolResult = ', extractedToolResult);
  /*
  if (extractedToolResult) {
    return NextResponse.json(extractedToolResult);
  }
  */

  // TODO: toolCalls
  return NextResponse.json({ ...result, text: extractedToolResult?.text || result.text, toolResults: [extractedToolResult] });
}
