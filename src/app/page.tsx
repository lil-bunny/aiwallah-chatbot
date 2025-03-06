"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=<Api_key>";

type Message = {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
};

declare const pdfjsLib: any;

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [pdfText, setPdfText] = useState<string>("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    };
    document.body.appendChild(script);
  }, []);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;
    const userMessage: Message = { id: uuidv4(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const formattedMessages = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    formattedMessages.push({ role: "user", parts: [{ text: input + (pdfText ? "\n\n" + pdfText : "") }] });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: formattedMessages,
          generationConfig: {
            temperature: 1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
          },
        }),
      });
      
      const data = await response.json();
      const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, no response.";
      const aiMessage: Message = { id: uuidv4(), sender: "ai", text: aiResponseText };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setIsTyping(false);
      setPdfText(""); // Reset parsed PDF content after sending
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let textContent = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((item: any) => item.str).join(" ") + " ";
      }
      
      console.log("Parsed PDF Content:", textContent);
      setPdfText(textContent);
      setMessages((prev) => [...prev, { id: uuidv4(), sender: "system", text: "1 file uploaded" }]);
    };
    reader.readAsArrayBuffer(file);
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
                    : msg.sender === "ai"
                    ? "bg-gray-200 text-black self-start mr-auto"
                    : "bg-green-500 text-white self-start mr-auto"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="bg-gray-200 text-black p-2 rounded-lg w-fit max-w-xs self-start mr-auto">
                Typing...
              </div>
            )}
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isTyping}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
