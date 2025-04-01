'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

interface Message {
  messageId?: string;
  role: string;
  content: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  isContinued?: boolean;
}

export default function McpClient() {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDataLoading(true);
    setStreamingContent('');
    
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          const data = await res.json();
          if (data.authUrl) {
            window.location.href = data.authUrl;
            return;
          }
        }
        throw new Error(`Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Streaming content
            const content = line.slice(2);
            setStreamingContent(prev => prev + content);
          } else if (line.startsWith('a:')) {
            // Tool call result
            const resultData = JSON.parse(line.slice(2));
            setStreamingContent(prev => prev + '\n\n' + resultData.result.content[0].text);
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'user',
        content: input
      }, {
        role: 'assistant',
        content: streamingContent
      }]);
      setInput('');

    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : String(err));
      setStreamingContent('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      setTimeout(() => setDataLoading(false), 500);
    }
  };
  
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Loan Pool Assistant</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={input}
            onChange={event => {
              setInput(event.target.value);
            }}
            placeholder="Example: Find high yield USDC pools with low risk on Ethereum"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Loading...</span>
            </>
          ) : 'Submit'}
        </button>
      </form>

      {/* Display streaming content */}
      {streamingContent && (
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <pre className="whitespace-pre-wrap">{streamingContent}</pre>
        </div>
      )}
      
      {/* Display chat messages */}
      {messages.map((message, index) => (
        <div key={index} className="border p-4 rounded-md bg-gray-50 mb-2">
          <div className="font-semibold">{message.role === 'user' ? 'You:' : 'Assistant:'}</div>
          <pre className="whitespace-pre-wrap">{message.content}</pre>
        </div>
      ))}
    </div>
  );
}