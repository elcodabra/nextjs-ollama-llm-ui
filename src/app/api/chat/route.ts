import { z } from 'zod';
import { createOllama } from 'ollama-ai-provider';
import {
  streamText,
  convertToCoreMessages,
  UserContent,
  tool,
  NoSuchToolError,
  InvalidToolArgumentsError,
  ToolExecutionError, generateText, createDataStreamResponse
} from 'ai';
import { weatherTool } from "@/lib/tools";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Destructure request data
  const { messages, selectedModel, data } = await req.json();

  const ollamaUrl = process.env.OLLAMA_URL;

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({baseURL: ollamaUrl + "/api"});

  // Build message content array directly
  const messageContent: UserContent = [{ type: 'text', text: currentMessage.content }];

  // Add images if they exist
  data?.images?.forEach((imageUrl: string) => {
    const image = new URL(imageUrl);
    messageContent.push({ type: 'image', image });
  });

  console.log('model = ', selectedModel, ollama(selectedModel));

  const messagesList = [
    // ...convertToCoreMessages(initialMessages),
    { role: 'user', content: messageContent },
  ]

  console.log('messagesList = ', messagesList);

  /*
  return createDataStreamResponse({
    execute: async (dataStream) => {
      dataStream.writeData('initialized call');

      const result = await generateText({
        model: ollama('llama3.1:latest'),
        // model: ollama('yandex/YandexGPT-5-Lite-8B-instruct-GGUF:latest'),
        tools: {
          weather: weatherTool,
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
        messages,
      });

      dataStream.writeData(result.text);
    },
    onError: error => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  });
  */

  // const newData = new StreamData();

  // https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
  // https://github.com/vercel/ai/issues/4700
  // https://community.vercel.com/t/streamtext-tool-invocation-failure/7701
  // Stream text using the ollama model
  const result = await streamText({
    model: ollama(selectedModel, {
      experimentalStreamTools: true,
    }),
    messages: messagesList,
    tools: {
      weather: weatherTool,
    },
    onChunk({ chunk }) {
      console.log('onChunk = ', chunk);
    },
    onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
      // your own logic, e.g. for saving the chat history or recording usage
      console.log('onStepFinish = ', text, toolCalls, toolResults, finishReason, usage);
    },
    onFinish() {
      console.log('onFinish');
      // newData.close();
    },
    onError({ error }) {
      console.error('Error = ', error); // your error logging logic here
    },
    maxSteps: 2,
    experimental_toolCallStreaming: true,
  });

  return result.toDataStreamResponse({
    getErrorMessage: error => {
      if (NoSuchToolError.isInstance(error)) {
        return 'The model tried to call a unknown tool.';
      } else if (InvalidToolArgumentsError.isInstance(error)) {
        return 'The model called a tool with invalid arguments.';
      } else if (ToolExecutionError.isInstance(error)) {
        return 'An error occurred during tool execution.';
      } else {
        return 'An unknown error occurred.';
      }
    }
  });

  /*
  const result = await generateText({
    model: ollama(selectedModel),
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
    },
    prompt: 'What is the weather in San Francisco?',
  });

  console.log('result = ', result)

  return result;
  */
}
