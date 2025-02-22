"use client"
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage: Message = { id: uuidv4(), sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    
    setTimeout(() => {
      const botReply: Message = {
        id: uuidv4(),
        sender: "ai",
        text: `AI: ${newMessage.text.split('').reverse().join('')}`,
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">My Chatbot</h1>
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent className="p-4 flex flex-col space-y-4">
          <ScrollArea className="h-96 overflow-y-auto border rounded-md p-2 flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg w-fit max-w-xs ${
                  msg.sender === "user" 
                    ? "bg-blue-500 text-white self-end ml-auto" 
                    : "bg-gray-200 text-black self-start mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
