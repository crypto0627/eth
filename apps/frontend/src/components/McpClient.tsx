'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function McpClient() {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  
  const { messages, input, setInput } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDataLoading(true);
    
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
        } else {
          throw new Error(`Request failed with status ${res.status}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      // Give a small delay to ensure data is loaded
      setTimeout(() => setDataLoading(false), 500);
    }
  };
  
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const TableLoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="ml-2 text-blue-600">Loading data...</span>
    </div>
  );
  
  return (
    <div className="max-w-2xl mx-auto p-4">
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
      
      {messages.map((message, index) => {
        if (message.role === 'assistant' && message.content.includes('Top USDC loan pools')) {
          const pools = message.content.split('---').filter(Boolean).map(pool => {
            const lines = pool.trim().split('\n');
            const poolData: Record<string, string> = {};
            lines.forEach(line => {
              const [key, value] = line.split(': ');
              if (key && value) {
                poolData[key.trim()] = value.trim();
              }
            });
            return poolData;
          });

          return (
            <div key={index} className="border p-4 rounded-md bg-gray-50 mb-2 overflow-x-auto">
              <div className="font-semibold mb-2">Assistant:</div>
              {dataLoading ? (
                <TableLoadingSpinner />
              ) : (
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2">Project</th>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">APY</th>
                      <th className="px-4 py-2">Base APY</th>
                      <th className="px-4 py-2">Reward APY</th>
                      <th className="px-4 py-2">TVL</th>
                      <th className="px-4 py-2">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((pool, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border px-4 py-2">{pool['Project']}</td>
                        <td className="border px-4 py-2">{pool['Symbol']}</td>
                        <td className="border px-4 py-2">{pool['APY']}</td>
                        <td className="border px-4 py-2">{pool['Base APY']}</td>
                        <td className="border px-4 py-2">{pool['Reward APY']}</td>
                        <td className="border px-4 py-2">{pool['TVL']}</td>
                        <td className="border px-4 py-2">{pool['Risk Level']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        }
        
        return (
          <div key={index} className="border p-4 rounded-md bg-gray-50 mb-2">
            <div className="font-semibold">{message.role === 'user' ? 'You:' : 'Assistant:'}</div>
            <div>{message.content}</div>
          </div>
        );
      })}
    </div>
  );
}