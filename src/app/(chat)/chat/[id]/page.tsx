"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import useChatStore from "@/app/hooks/useChatStore";
import {generateUUID} from "@/lib/utils";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;

  const getChatById = useChatStore((state) => state.getChatById);
  const systemMessage = useChatStore((state) => state.systemMessage);
  const chat = getChatById(id);

  if (!chat) {
    return notFound();
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <ChatLayout
        key={id}
        id={id}
        // initialMessages={chat.messages}
        initialMessages={chat.messages.length > 0 ? chat.messages : systemMessage ? [{ id: generateUUID(), role: "system", content: systemMessage }] : []}
        navCollapsedSize={10}
        defaultLayout={[30, 160]}
        isSimple
      />
    </main>
  );
}
