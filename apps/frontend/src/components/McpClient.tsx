'use client';

import { useState } from 'react';

export default function McpClient() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPools, setParsedPools] = useState<any[]>([]);
  const [responseReady, setResponseReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toISOString()}] ${info}`]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugInfo('Form submitted with prompt: ' + prompt.substring(0, 50) + '...');
    setLoading(true);
    setError(null);
    setResponse('');
    setParsedPools([]);
    setResponseReady(false);
    setDebugInfo([]);
    
    try {
      addDebugInfo('Sending fetch request to /api/mcp');
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      addDebugInfo(`Response received: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        if (res.status === 401) {
          addDebugInfo('Authentication required (401)');
          const data = await res.json();
          addDebugInfo('Auth response data: ' + JSON.stringify(data));
          if (data.authUrl) {
            addDebugInfo('Redirecting to auth URL: ' + data.authUrl);
            window.location.href = data.authUrl;
            return;
          }
        } else if (res.status === 500) {
          try {
            const errorData = await res.json();
            addDebugInfo('Error data: ' + JSON.stringify(errorData));
            if (errorData.error === "mcp_server_error" || errorData.error === "mcp_stream_error") {
              throw new Error(errorData.message || "The MCP server encountered an error");
            }
          } catch (jsonError) {
            // If we can't parse the error as JSON, just use the status text
            addDebugInfo('Error parsing error response: ' + jsonError);
          }
        }
        throw new Error(`Request failed with status ${res.status}`);
      }
      
      addDebugInfo('Getting reader from response body');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let done = false;
        let text = '';
        let chunkCount = 0;
        let rawChunks = [];
        
        addDebugInfo('Starting to read stream');
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            rawChunks.push(chunk);
            addDebugInfo(`Received chunk #${chunkCount}: ${chunk.substring(0, 50).replace(/\n/g, '\\n')}${chunk.length > 50 ? '...' : ''}`);
            
            // Check for error patterns in the chunk
            if (chunk.includes('3:"An error occurred"') || chunk.includes('"An error occurred."')) {
              addDebugInfo('ERROR DETECTED in chunk: ' + chunk);
              throw new Error('The MCP server encountered an error processing your request.');
            }
            
            text += chunk;
            setResponse(text);
            
            try {
              const lines = text.split('\n');
              for (const line of lines) {
                if (line.startsWith('a:') && line.includes('result')) {
                  addDebugInfo('Found result line: ' + line.substring(0, 50) + '...');
                  const jsonStr = line.substring(2);
                  const data = JSON.parse(jsonStr);
                  if (data.result?.content?.[0]?.text) {
                    addDebugInfo('Parsing pools data from response');
                    const poolsData = parsePoolsData(data.result.content[0].text);
                    addDebugInfo('Parsed pools: ' + poolsData.length);
                    setParsedPools(poolsData);
                  }
                }
              }
            } catch (parseErr) {
              addDebugInfo('Error parsing pools data: ' + parseErr);
            }
          }
        }
        
        addDebugInfo('Stream reading complete');
        
        // For debugging, analyze all raw chunks
        if (parsedPools.length === 0) {
          addDebugInfo('No pools parsed, raw chunks: ' + JSON.stringify(rawChunks));
        }
        
        setResponseReady(true);
      } else {
        addDebugInfo('No reader available from response');
      }
    } catch (err) {
      addDebugInfo('Error in handleSubmit: ' + err.message);
      setError(err.message || 'An error occurred');
    } finally {
      addDebugInfo('Request handling complete');
      setLoading(false);
    }
  };
  
  const parsePoolsData = (text: string): any[] => {
    addDebugInfo('Parsing pools data from text: ' + text.substring(0, 100) + '...');
    const pools = [];
    const poolsText = text.split('---');
    addDebugInfo(`Found ${poolsText.length} pool sections`);
    
    for (const poolText of poolsText) {
      if (!poolText.trim()) continue;
      
      const pool: Record<string, string> = {};
      const lines = poolText.trim().split('\n');
      addDebugInfo(`Processing pool with ${lines.length} lines`);
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':', 2);
          pool[key.trim()] = value.trim();
        }
      }
      
      if (Object.keys(pool).length > 0) {
        addDebugInfo('Added pool: ' + JSON.stringify(pool));
        pools.push(pool);
      }
    }
    
    addDebugInfo(`Returning ${pools.length} parsed pools`);
    return pools;
  };
  
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Loan Pool Assistant</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
            Ask about loan pools:
          </label>
          <textarea
            id="prompt"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
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
      
      {loading && !parsedPools.length && !responseReady && (
        <div className="flex justify-center items-center p-8">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-lg text-gray-700">Processing your request...</span>
        </div>
      )}
      
      {parsedPools.length > 0 ? (
        <div className="border p-4 rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Loan Pools:</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chain</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedPools.map((pool, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap">{pool['Project']}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{pool['Chain']}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{pool['Symbol']}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>{pool['APY']}</div>
                      <div className="text-xs text-gray-500">
                        Base: {pool['Base APY']} | Reward: {pool['Reward APY']}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{pool['TVL']}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pool['Risk Level'].includes('High') 
                          ? 'bg-red-100 text-red-800' 
                          : pool['Risk Level'].includes('Medium')
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {pool['Risk Level']}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : responseReady && response ? (
        <div className="border p-4 rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      ) : null}
      
      {/* Debug Information Panel */}
      <div className="mt-6 border p-4 rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
          Debug Information
          <button 
            onClick={() => navigator.clipboard.writeText(debugInfo.join('\n'))}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Copy
          </button>
        </h2>
        <div className="h-64 overflow-y-auto bg-gray-800 text-green-400 p-2 rounded font-mono text-xs">
          {debugInfo.length > 0 ? 
            debugInfo.map((info, i) => <div key={i}>{info}</div>) : 
            <div>No debug information available</div>
          }
        </div>
      </div>
    </div>
  );
}