import { useState, useCallback, useRef, useEffect } from 'react';
import { buildApiUrl } from '@/lib/api';

export type EchoMessage = {
  role: 'user' | 'bot';
  text: string;
};

export type XRayStatus = 'idle' | 'initializing' | 'expanding' | 'retrieved' | 'grading' | 'generating' | 'done';

export type XRayEventContent = {
  status: XRayStatus;
  queries?: string[];
  docs?: { content: string; score: string }[];
  passedGrading?: boolean;
};

export function useEchoChat(threadId: string) {
  const [messages, setMessages] = useState<EchoMessage[]>([
    { role: 'bot', text: 'Hello! I am Echo. Upload a document and ask me anything about it.' }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [xrayState, setXrayState] = useState<XRayEventContent>({ status: 'idle' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'bot', text: '' }]);
    setXrayState({ status: 'initializing' });

    try {
      const response = await fetch(buildApiUrl('chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, threadId }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let textAcc = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunkStr = decoder.decode(value, { stream: true });
          const streamMsgs = chunkStr.split('\n\n');
          for (const msg of streamMsgs) {
            if (msg.startsWith('data: ')) {
              const dataStr = msg.replace('data: ', '');
              if (dataStr === '[DONE]') {
                setIsStreaming(false);
                setXrayState(prev => ({ ...prev, status: 'done' }));
              } else {
                try {
                  const dataObj = JSON.parse(dataStr);
                  if (dataObj.status) {
                    setXrayState((prev) => ({ ...prev, ...dataObj }));
                  } else if (dataObj.text) {
                    textAcc += dataObj.text;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1].text = textAcc;
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete chunks just in case
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = 'Sorry, I am having trouble answering right now.';
        return newMessages;
      });
      setXrayState({ status: 'idle' });
      setIsStreaming(false);
    }
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return { messages, isStreaming, xrayState, sendMessage, messagesEndRef };
}
