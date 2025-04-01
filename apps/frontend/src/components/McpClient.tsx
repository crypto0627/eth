'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';

interface LoanPool {
  project: string;
  chain: string;
  symbol: string;
  apy: number;
  baseApy: number;
  rewardApy: number;
  tvl: string;
  riskLevel: string;
  poolMeta: string | null;
}

export default function McpClient() {
  const [loading, setLoading] = useState(false);
  const [loanPools, setLoanPools] = useState<LoanPool[]>([]);
  
  const { messages, input, setInput, append } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoanPools([]);
    
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: input,
        }),
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
      
      const data = await res.json();
      
      // Process the response to extract loan pools if available
      if (data.result && data.result.content) {
        const content = data.result.content[0].text;
        const pools = parsePoolsFromText(content);
        setLoanPools(pools);
      }
      
      // Add the message to the chat
      await append({
        role: 'assistant',
        content: data.message || 'I found some loan pools for you.'
      });
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const parsePoolsFromText = (text: string): LoanPool[] => {
    const pools: LoanPool[] = [];
    const poolSections = text.split('---');
    
    for (const section of poolSections) {
      if (!section.trim()) continue;
      
      const lines = section.trim().split('\n');
      const pool: Partial<LoanPool> = {};
      
      for (const line of lines) {
        if (line.startsWith('Project:')) pool.project = line.replace('Project:', '').trim();
        else if (line.startsWith('Chain:')) pool.chain = line.replace('Chain:', '').trim();
        else if (line.startsWith('Symbol:')) pool.symbol = line.replace('Symbol:', '').trim();
        else if (line.startsWith('APY:')) pool.apy = parseFloat(line.replace('APY:', '').replace('%', '').trim());
        else if (line.startsWith('Base APY:')) pool.baseApy = parseFloat(line.replace('Base APY:', '').replace('%', '').trim());
        else if (line.startsWith('Reward APY:')) pool.rewardApy = parseFloat(line.replace('Reward APY:', '').replace('%', '').trim());
        else if (line.startsWith('TVL:')) pool.tvl = line.replace('TVL:', '').trim();
        else if (line.startsWith('Risk Level:')) pool.riskLevel = line.replace('Risk Level:', '').trim();
        else if (line.startsWith('Pool Meta:')) {
          const meta = line.replace('Pool Meta:', '').trim();
          pool.poolMeta = meta === 'None' ? null : meta;
        }
      }
      
      if (pool.project) {
        pools.push(pool as LoanPool);
      }
    }
    
    return pools;
  };
  
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high risk': return 'bg-red-100 text-red-800';
      case 'medium risk': return 'bg-yellow-100 text-yellow-800';
      case 'low risk': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
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
      
      {loanPools.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Available Loan Pools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loanPools.map((pool, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium">{pool.project}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(pool.riskLevel)}`}>
                    {pool.riskLevel}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-1">{pool.chain} • {pool.symbol}</div>
                {pool.poolMeta && <div className="text-xs text-gray-500 mb-2">{pool.poolMeta}</div>}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">APY</div>
                    <div className="font-semibold text-green-600">{pool.apy.toFixed(2)}%</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">TVL</div>
                    <div className="font-semibold">{pool.tvl}</div>
                  </div>
                </div>
                <button className="w-full mt-3 py-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 text-sm hover:bg-blue-100 transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`p-4 rounded-md ${message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <div className="font-semibold mb-1">{message.role === 'user' ? 'You:' : 'Assistant:'}</div>
            <div className="text-gray-700">{message.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}