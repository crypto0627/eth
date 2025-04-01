import { experimental_createMCPClient, streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { cookies } from 'next/headers';

export const runtime = 'edge'

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
  
  console.log('Access token available:', !!accessToken);
  
  try {
    console.log('Creating MCP client with SSE transport');
    const sseClient = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url: `${MCP_SERVER_URL}/sse`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
      },
    });
    
    console.log('Fetching available tools');
    const toolSet = await sseClient.tools();
    console.log('Available tools:', toolSet);
    
    try {
      console.log('Creating streaming response with prompt:', prompt.substring(0, 100) + '...');
      
      const response = streamText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        tools: toolSet,
        prompt,
        onFinish: () => {
          console.log('Stream finished');
          sseClient.close();
        },
      });
      
      console.log('Returning stream response');
      return response.toDataStreamResponse();
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      sseClient.close();
      
      if (streamError instanceof Error) {
        console.error('Error details:', streamError.message);
      }
      
      throw streamError;
    }
  } catch (error) {
    console.error('Error in MCP API:', error);
    
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