"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [chatBoxOpen, setChatBoxOpen] = useState(true);
  
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hello! I am Echo. Upload a document and ask me anything about it." }
  ]);
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState("uploading");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setUploadState("success");
        setTimeout(() => setUploadState("idle"), 3000);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      setUploadState("error");
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setQuery("");
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "bot", text: "" }]);

    try {
      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let textAcc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value, { stream: true });
          const messages = chunkStr.split("\n\n");
          for (const msg of messages) {
            if (msg.startsWith("data: ")) {
              const dataStr = msg.replace("data: ", "");
              if (dataStr === "[DONE]") {
                setIsTyping(false);
              } else {
                try {
                  const dataObj = JSON.parse(dataStr);
                  if (dataObj.text) {
                    textAcc += dataObj.text;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1].text = textAcc;
                      return newMessages;
                    });
                  }
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = "Sorry, I am having trouble answering right now.";
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center p-8 font-sans">
      <header className="max-w-4xl w-full flex justify-between items-center py-6 border-b border-white/10 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">Echo</h1>
        </div>
        <div className="text-sm text-gray-400 font-medium">Internal Admin Dashboard</div>
      </header>

      <main className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl h-fit">
          <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Ingest Knowledge</h2>
          <p className="text-gray-400 text-sm mb-6">Upload whitepapers, logs, or manuals to your organization's vector store.</p>
          
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors hover:border-blue-500/30">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
             </div>
             <label className="cursor-pointer">
                <span className="bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/20 transition">Select file</span>
                <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />
             </label>
             {file && (
               <div className="mt-4 text-sm text-blue-400 font-medium truncate max-w-[200px]">{file.name}</div>
             )}
          </div>

          <button 
            disabled={!file || uploadState === "uploading"}
            onClick={handleUpload}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all flex justify-center"
          >
            {uploadState === "uploading" ? "Embedding..." : uploadState === "success" ? "Embedded Successfully" : "Process & Embed"}
          </button>
        </section>

        {/* Chat Section */}
        <section className="flex flex-col h-[500px] relative">
           <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col h-full overflow-hidden shadow-2xl">
              <div className="bg-white/5 border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-sm font-semibold text-white/80">Echo Agent</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white/10 text-white/90 rounded-bl-none leading-relaxed"}`}>
                       {msg.text || (isTyping && i === messages.length - 1 ? <span className="animate-pulse">Thinking...</span> : "")}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleAsk} className="flex gap-2 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about the uploaded document..."
                    className="w-full bg-white/5 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button type="submit" disabled={!query.trim() || isTyping} className="absolute right-2 top-1.5 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 transition">
                    <svg className="w-4 h-4 translate-x-[1px] translate-y-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5m0 0l-7 7m7-7l7 7"></path></svg>
                  </button>
                </form>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
}
