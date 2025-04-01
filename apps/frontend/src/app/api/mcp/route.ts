import { experimental_createMCPClient, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { cookies } from 'next/headers';

// OAuth configuration
const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';
const OAUTH_REDIRECT_URI = 'https://eth-frontend.vercel.app/api/auth/callback';

// Client ID for OAuth
const CLIENT_ID = 'DR7fyY0aU6qcxqD0';

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

  // Set a timeout for the request
  const TIMEOUT_MS = 60000; // 60 seconds timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
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
    
    // Get tools with timeout
    const toolSet = await Promise.race([
      sseClient.tools(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Tools fetch timeout')), 10000)
      )
    ]);
    
    // Return the response directly without additional processing
    return streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      tools: toolSet as any, // Type assertion to resolve the type error
      prompt,
      onFinish: () => {
        console.log('Stream finished');
        sseClient.close();
        clearTimeout(timeoutId);
      },
    }).toDataStreamResponse();
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error details:', error);
    
    if (error.name === 'AbortError') {
      return Response.json({ 
        error: "request_timeout",
        message: "The request took too long to process"
      }, { status: 504 });
    }
    
    // Handle token errors
    if (error.response?.status === 401 || error.message?.includes('unauthorized')) {
      cookieStore.delete('cf_access_token');
      cookieStore.delete('cf_refresh_token');
      
      return Response.json({ 
        error: "token_expired",
        authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
      }, { status: 401 });
    }
    
    return Response.json({ 
      error: "server_error",
      message: error.message || "Unknown error occurred"
    }, { status: 500 });
  }
}