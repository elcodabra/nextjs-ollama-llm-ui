'use client';

import { useCallback, useEffect, useState } from 'react';
import {ChatRequestOptions, generateId} from 'ai';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type UseSimpleChatProps = {
  id?: string;
  initialMessages?: Message[];
  onResponse?: (message: Message) => void;
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
  onToolCall?: (...args: any[]) => void;
  onToolResult?: (...args: any[]) => void;
};

export function useSimpleChat({
  id,
  initialMessages = [],
  onResponse,
  onFinish,
  onError,
  onToolCall,
  onToolResult,
}: UseSimpleChatProps = {}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const sendPrompt = useCallback(
    async (prompt: string, requestOptions: ChatRequestOptions) => {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: prompt,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat/text', {
          method: 'POST',
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({ role, content })),
            id,
            ...requestOptions.body || {},
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.text,
        };

        onResponse?.(assistantMessage);

        setMessages((prev) => [...prev, assistantMessage]);
        onFinish?.(assistantMessage);
        // TODO: doesn't work
        onToolCall?.(data.toolCalls);
        onToolResult?.(data.toolResults);
      } catch (err: any) {
        onError?.(err);
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, id, onResponse, onFinish, onToolCall, onError]
  );

  const handleSubmit = async (e: React.FormEvent, requestOptions: ChatRequestOptions) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInput('');
    await sendPrompt(input, requestOptions);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const reload = (requestOptions: ChatRequestOptions) => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      sendPrompt(lastUser.content, requestOptions);
    }
  };

  const stop = () => {
    console.warn('Stop not implemented for non-streaming generateText.');
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
  };
}
