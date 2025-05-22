"use client";

import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import React from "react";
import {toast} from "sonner";
import useChatStore from "@/app/hooks/useChatStore";
import {Textarea} from "@/components/ui/textarea";

const formSchema = z.object({
  systemMessage: z.string().optional(),
  temperature: z.string().min(0).optional(),
  maxTokens: z.string().min(0).optional(),
});

interface EditChatFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function stopPropagate(callback: () => void) {
  return (e: {stopPropagation: () => void, preventDefault: () => void}) => {
    e.preventDefault();
    e.stopPropagation()
    callback()
  }
}

export default function EditChatForm({setOpen}: EditChatFormProps) {
  const systemMessage = useChatStore((state) => state.systemMessage);
  const temperature = useChatStore((state) => state.temperature);
  const maxTokens = useChatStore((state) => state.maxTokens);
  const setSystemMessage = useChatStore((state) => state.setSystemMessage);
  const setTemperature = useChatStore((state) => state.setTemperature);
  const setMaxTokens = useChatStore((state) => state.setMaxTokens);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemMessage: systemMessage || '',
      temperature: temperature ? String(temperature) : '0',
      maxTokens: maxTokens ? String(maxTokens) : '0',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSystemMessage(values.systemMessage);
    setTemperature(values.temperature ? parseFloat(values.temperature) : undefined);
    setMaxTokens(values.maxTokens ? parseInt(values.maxTokens) : undefined);
    toast.success("Chat settings updated successfully");
  }

  return (
    <Form {...form}>
      <form onSubmit={stopPropagate(form.handleSubmit(onSubmit))} className="space-y-8">
        <FormField
          control={form.control}
          name="temperature"
          render={({field}) => (
            <FormItem>
              <FormLabel>Temperature</FormLabel>
              <FormControl>
                <div className="md:flex gap-4">
                  <Input {...field} type="number" step={0.1} max={1} placeholder="Enter temperature"/>
                </div>
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxTokens"
          render={({field}) => (
            <FormItem>
              <FormLabel>Max Tokens</FormLabel>
              <FormControl>
                <div className="md:flex gap-4">
                  <Input {...field} type="number" step={50} placeholder="Enter max tokens"/>
                </div>
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="systemMessage"
          render={({field}) => (
            <FormItem>
              <FormLabel>System Message</FormLabel>
              <FormControl>
                <div className="md:flex gap-4">
                  <Textarea {...field} placeholder="Enter your system message"/>
                </div>
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
