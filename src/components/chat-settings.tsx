"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { GearIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import EditChatForm from "@/components/edit-chat-form";

export default function ChatSettings({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="shrink-0 rounded-full"
          variant="ghost"
          size="icon"
          type="button"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        >
          <GearIcon className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle>Chat Settings</DialogTitle>
          <EditChatForm setOpen={setOpen} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
