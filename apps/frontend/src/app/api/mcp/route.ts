import { experimental_createMCPClient, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { cookies } from 'next/headers';

export const runtime = 'edge'

// OAuth configuration
const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';
const OAUTH_REDIRECT_URI = 'http://localhost:3001/api/auth/callback';

// Client ID for OAuth
const CLIENT_ID = 'nr6juLFC8fDKPeyx';

export async function POST(req: Request) {
  console.log('MCP api is called')
  const { prompt } = await req.json();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('cf_access_token')?.value;
  
  if (!accessToken) {
    return Response.json({ 
      error: "authentication_required",
      authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
    }, { status: 401 });
  }
  console.log(cookieStore.get('cf_access_token')?.value)
  try {
    const sseClient = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: `${MCP_SERVER_URL}/sse`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
      },
    });
    const toolSet = await sseClient.tools();
    console.log('Available tools:', toolSet);
    
    try {
      const response = await streamText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        tools: toolSet,
        prompt,
        onFinish: () => sseClient.close(),
      });
      
      console.log('Streaming response created successfully');
      return response.toDataStreamResponse();
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      sseClient.close();
      
      // 檢查是否為 SSE 特定錯誤格式
      if (typeof streamError === 'string' && streamError.includes('An error occurred')) {
        const errorParts = streamError.split(':');
        return Response.json({ 
          error: "mcp_stream_error",
          code: errorParts[0],
          message: errorParts[1] || "Unknown streaming error"
        }, { status: 500 });
      }
      
      throw streamError; // 重新拋出以便外層 catch 處理
    }
  } catch (error) {
    console.error('Error details:', error);
    
    // Handle token errors
    if (error.response?.status === 401 || error.message?.includes('unauthorized')) {
      cookieStore.delete('cf_access_token');
      cookieStore.delete('cf_refresh_token');
      
      return Response.json({ 
        error: "token_expired",
        authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
      }, { status: 401 });
    }
    
    // Handle SSE specific errors
    if (error.message?.includes('An error occurred') || 
        (typeof error === 'string' && error.includes('An error occurred'))) {
      return Response.json({ 
        error: "mcp_server_error",
        message: "The MCP server encountered an error processing your request."
      }, { status: 500 });
    }
    
    return new Response(`Internal Server Error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}