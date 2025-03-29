import { NextRequest } from 'next/server';
import MCPClient from '@/lib/mcp-client'; // 確保路徑正確

let mcpClient: MCPClient | null = null;

async function initializeMcpClient() {
  if (!mcpClient) {
    mcpClient = new MCPClient();
    // 根據您的實際路徑調整
    await mcpClient.connectToServer('/Users/jakekuo/Desktop/web3-workspace/eth-global-taipei-team-3p/apps/mcp-server/build/index.js');
  }
  return mcpClient;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    const client = await initializeMcpClient();
    const result = await client.processQuery(query);

    // 解析結果
    const responseData = {
      rawText: result,
      // 解析工具調用和結果
      toolCalls: result.split('\n').reduce((acc: any[], line: string) => {
        if (line.startsWith('[Calling tool')) {
          const toolCall = {
            call: line,
            result: ''
          };
          acc.push(toolCall);
        } else if (acc.length > 0) {
          acc[acc.length - 1].result += line + '\n';
        }
        return acc;
      }, [])
    };

    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing MCP query:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process query' }), 
      { status: 500 }
    );
  }
}