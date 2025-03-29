'use client';

import { useState } from 'react';

interface ToolCall {
  call: string;
  result: string;
}

interface QueryResult {
  rawText: string;
  toolCalls: ToolCall[];
}

export default function McpQuery() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium">
            Enter your query:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
            rows={4}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          {result.toolCalls.map((toolCall, index) => (
            <div key={index} className="border rounded-md p-4">
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                {toolCall.call}
              </div>
              <div className="mt-2 whitespace-pre-wrap">
                {toolCall.result}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}