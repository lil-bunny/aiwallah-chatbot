// "use client";
// import { useState, useEffect } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { v4 as uuidv4 } from "uuid";
// import { Upload, FileText } from 'lucide-react';

// // We'll load PDF.js from CDN
// declare const pdfjsLib: any;

// const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyB5TK4d119fIweLsOjaoVChBV0cEEnVPSg";

// type Message = {
//   id: string;
//   sender: "user" | "ai";
//   text: string;
//   isFile?: boolean;
//   fileName?: string;
// };

// export default function Chatbot() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState<string>("");
//   const [isTyping, setIsTyping] = useState<boolean>(false);
//   const [isUploading, setIsUploading] = useState<boolean>(false);
//   const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);

//   useEffect(() => {
//     // Load PDF.js script
//     const script = document.createElement('script');
//     script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
//     script.onload = () => {
//       // Set worker source after script loads
//       pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
//       setIsPdfJsLoaded(true);
//     };
//     document.body.appendChild(script);

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     try {
//       if (!isPdfJsLoaded) {
//         alert('PDF.js is still loading. Please try again in a moment.');
//         return;
//       }

//       const file = e.target.files?.[0];
//       console.log("File selected:", file); // Debug log

//       if (!file) {
//         console.log("No file selected");
//         return;
//       }

//       console.log("File type:", file.type);
//       console.log("File size:", file.size);
//       console.log("File name:", file.name);

//       if (file.type !== 'application/pdf') {
//         alert('Please upload a valid PDF file. Selected file type: ' + file.type);
//         return;
//       }

//       setIsUploading(true);

//       // Add file upload message
//       const fileMessage: Message = {
//         id: uuidv4(),
//         sender: "user",
//         text: `Uploading file: ${file.name}...`,
//         isFile: true,
//         fileName: file.name
//       };
//       setMessages(prev => [...prev, fileMessage]);

//       // Read file as ArrayBuffer for PDF parsing
//       const fileReader = new FileReader();
      
//       fileReader.onerror = (error) => {
//         console.error("FileReader error:", error);
//         setMessages(prev => [...prev, {
//           id: uuidv4(),
//           sender: "ai",
//           text: "Error reading the file. Please try again.",
//         }]);
//         setIsUploading(false);
//       };

//       fileReader.onload = async function() {
//         try {
//           console.log("FileReader loaded successfully"); // Debug log
//           const typedarray = new Uint8Array(this.result as ArrayBuffer);
          
//           console.log("Loading PDF document..."); // Debug log
//           const pdf = await pdfjsLib.getDocument(typedarray).promise;
//           console.log("PDF loaded successfully, pages:", pdf.numPages); // Debug log
          
//           let fullText = '';
//           const numPages = pdf.numPages;

//           // Process each page
//           for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
//             console.log(`Processing page ${pageNumber} of ${numPages}`);
//             const page = await pdf.getPage(pageNumber);
//             const content = await page.getTextContent();
            
//             const pageText = content.items
//               .map((item: any) => item.str)
//               .join(' ');
            
//             fullText += `\n--- Page ${pageNumber} ---\n${pageText}\n`;
//           }

//           // Log the entire content to console
//           console.log("Full PDF Content:");
//           console.log(fullText);

//           // Update the file message to show completion
//           setMessages(prev => prev.map(msg => 
//             msg.id === fileMessage.id 
//               ? { ...msg, text: `Uploaded and parsed: ${file.name}` }
//               : msg
//           ));

//           // Add a summary message to the chat
//           setMessages(prev => [...prev, {
//             id: uuidv4(),
//             sender: "ai",
//             text: `Successfully parsed PDF "${file.name}":\n- ${numPages} pages\n- ${(fullText.length / 1024).toFixed(2)} KB of text extracted`,
//           }]);

//         } catch (error) {
//           console.error('Error parsing PDF:', error);
//           setMessages(prev => [...prev, {
//             id: uuidv4(),
//             sender: "ai",
//             text: "Sorry, there was an error parsing the PDF file. Please make sure it's a valid PDF document.",
//           }]);
//         } finally {
//           setIsUploading(false);
//         }
//       };

//       console.log("Starting to read file as ArrayBuffer"); // Debug log
//       fileReader.readAsArrayBuffer(file);
//     } catch (error) {
//       console.error("Unexpected error during file upload:", error);
//       setMessages(prev => [...prev, {
//         id: uuidv4(),
//         sender: "ai",
//         text: "An unexpected error occurred. Please try again.",
//       }]);
//       setIsUploading(false);
//     }
//   };

//   const sendMessage = async (): Promise<void> => {
//     if (!input.trim()) return;
//     const userMessage: Message = { id: uuidv4(), sender: "user", text: input };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");
//     setIsTyping(true);

//     const formattedMessages = messages.map((msg) => ({
//       role: msg.sender === "user" ? "user" : "model",
//       parts: [{ text: msg.text }],
//     }));

//     formattedMessages.push({ role: "user", parts: [{ text: input }] });

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: formattedMessages,
//           generationConfig: {
//             temperature: 1,
//             topK: 40,
//             topP: 0.95,
//             maxOutputTokens: 8192,
//             responseMimeType: "text/plain",
//           },
//         }),
//       });
      
//       const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
//       const aiResponseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, no response.";
//       const aiMessage: Message = { id: uuidv4(), sender: "ai", text: aiResponseText };
      
//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (error) {
//       console.error("Error fetching AI response:", error);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
//       <h1 className="text-2xl font-bold mb-4">My Chatbot</h1>
//       <Card className="w-full max-w-lg shadow-lg">
//         <CardContent className="p-4 flex flex-col space-y-4">
//           <ScrollArea className="h-96 overflow-y-auto border rounded-md p-2 flex flex-col gap-2">
//             {messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`p-2 rounded-lg w-fit max-w-xs ${
//                   msg.sender === "user"
//                     ? "bg-blue-500 text-white self-end ml-auto"
//                     : "bg-gray-200 text-black self-start mr-auto"
//                 } ${msg.isFile ? "flex items-center gap-2" : ""}`}
//               >
//                 {msg.isFile && <FileText className="w-4 h-4" />}
//                 {msg.text}
//               </div>
//             ))}
//             {isTyping && (
//               <div className="bg-gray-200 text-black p-2 rounded-lg w-fit max-w-xs self-start mr-auto">
//                 Typing...
//               </div>
//             )}
//           </ScrollArea>
//           <div className="flex items-center gap-2">
//             <Input
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type a message..."
//               className="flex-1"
//             />
//             <label htmlFor="file-upload" className="cursor-pointer">
//               <Button 
//                 variant="outline" 
//                 size="icon" 
//                 type="button"
//                 disabled={isUploading}
//                 onClick={() => document.getElementById('file-upload')?.click()}
//               >
//                 <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
//               </Button>
//               <input
//                 id="file-upload"
//                 type="file"
//                 accept=".pdf,application/pdf"
//                 onChange={handleFileUpload}
//                 className="hidden"
//                 disabled={isUploading}
//               />
//             </label>
//             <Button onClick={sendMessage} disabled={isTyping || isUploading}>Send</Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBhUM4x7a-VtVtL4bG8SS0455UrPp1icOM";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load PDF.js dynamically from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    };
    document.body.appendChild(script);
  }, []);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    // Show only user text in UI
    const userMessage: Message = { id: uuidv4(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Prepare API message with input + PDF content (if available)
    let finalInput = input;
    if (pdfContent) {
      finalInput += `\n\n[Additional Context from PDF]:\n${pdfContent}`;
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    formattedMessages.push({ role: "user", parts: [{ text: finalInput }] });

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

      const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const aiResponseText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, no response.";
      const aiMessage: Message = { id: uuidv4(), sender: "ai", text: aiResponseText };

      setMessages((prev) => [...prev, aiMessage]);
      setPdfContent(null); // Clear the stored PDF text after sending
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      console.error("Please upload a valid PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      if (!e.target?.result) return;

      const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
      setPdfLoading(true);

      try {
        const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
        let textContent = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((item: any) => item.str).join(" ") + "\n";
        }

        console.log("Extracted PDF Content:\n", textContent);

        setMessages((prev) => [...prev, { id: uuidv4(), sender: "user", text: "📄 1 file uploaded" }]);
        setPdfContent(textContent); // Store parsed text for sending with input
      } catch (error) {
        console.error("Error parsing PDF:", error);
      } finally {
        setPdfLoading(false);
      }
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
                    : "bg-gray-200 text-black self-start mr-auto"
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isTyping || pdfLoading}>Send</Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-300 p-2 rounded-lg">
              {pdfLoading ? "Uploading..." : "📂 Upload PDF"}
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
