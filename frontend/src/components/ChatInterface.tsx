import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EchoMessage } from '@/hooks/useEchoChat';

interface ChatInterfaceProps {
  messages: EchoMessage[];
  isStreaming: boolean;
  sendMessage: (query: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatInterface({ messages, isStreaming, sendMessage, messagesEndRef }: ChatInterfaceProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;
    sendMessage(query);
    setQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800/80 p-4 flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Echo Agent
            </h2>
            <div className="flex items-center gap-2 text-xs text-emerald-400/80 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected & Ready
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 lg:p-6">
        <div className="space-y-6 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-[15px] shadow-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-100 text-zinc-900 rounded-br-sm'
                      : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800/50 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'bot' && !msg.text && isStreaming && i === messages.length - 1 ? (
                    <div className="flex items-center gap-1 h-6">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/50 backdrop-blur-md shrink-0 z-10">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your data..."
            className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100 h-14 pl-5 pr-16 rounded-2xl focus-visible:ring-1 focus-visible:ring-indigo-500/50 placeholder:text-zinc-600 shadow-inner"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || isStreaming}
            className="absolute right-2 h-10 w-10 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Send className="w-4 h-4 translate-x-0.5 translate-y-[1px]" />
          </Button>
        </form>
      </div>
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[80px] pointer-events-none" />
    </div>
  );
}
