import { experimental_createMCPClient, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { cookies } from 'next/headers';

// OAuth configuration
const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';
const OAUTH_REDIRECT_URI = 'https://ethglobal-tpe.pages.dev/api/auth/callback';

// Client ID for OAuth
const CLIENT_ID = 'plh3kJVTXu8kZFDI';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('cf_access_token')?.value;
  
  if (!accessToken) {
    return Response.json({ 
      error: "authentication_required",
      authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
    }, { status: 401 });
  }
  
  try {
    const sseClient = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: `${MCP_SERVER_URL}/sse`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      },
    });
    
    const toolSet = await sseClient.tools();
    
    const response = await streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      tools: toolSet,
      prompt,
      onFinish: () => sseClient.close(),
    });
    
    return response.toDataStreamResponse();
  } catch (error) {
    // Handle token errors
    if (error.response?.status === 401 || error.message?.includes('unauthorized')) {
      cookieStore.delete('cf_access_token');
      cookieStore.delete('cf_refresh_token');
      
      return Response.json({ 
        error: "token_expired",
        authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
      }, { status: 401 });
    }
    
    return new Response(`Internal Server Error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
}