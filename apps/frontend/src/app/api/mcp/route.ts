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
  console.log('MCP api is called');
  
  try {
    const { prompt } = await req.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('cf_access_token')?.value;
    
    console.log('Access token exists:', !!accessToken);
    if (!accessToken) {
      console.log('No access token found, redirecting to auth');
      return Response.json({ 
        error: "authentication_required",
        authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
      }, { status: 401 });
    }
    
    try {
      // Create MCP client with more detailed error handling
      console.log('Creating MCP client');
      const sseClient = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: `${MCP_SERVER_URL}/sse`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Origin': 'https://eth-frontend.vercel.app',
          },
        },
      });
      
      const toolSet = await sseClient.tools();
      try {
        console.log('Creating stream response');
        
        // Add timeout to ensure we don't hang indefinitely
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
        });
        
        const streamPromise = streamText({
          model: anthropic('claude-3-7-sonnet-20250219'),
          tools: toolSet,
          prompt,
        });
        
        // Race the stream against the timeout
        const response: any = await Promise.race([streamPromise, timeoutPromise]) as ReturnType<typeof streamText>;
        
        // Create headers with CORS support
        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'X-Accel-Buffering': 'no'
        });
        
        // Get the stream response with enhanced headers
        const streamResponse = new Response(response.toReadableStream(), {
          headers: headers
        });
        
        console.log('Response created successfully with status:', streamResponse.status);
        return streamResponse;
      } catch (streamError) {
        console.error('Error during streaming:', streamError);
        if (sseClient) sseClient.close();
        
        // Handle specific streaming errors
        const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
        console.error('Error message:', errorMessage);
        
        // Check for SSE specific error patterns
        if (errorMessage.includes('An error occurred') || errorMessage.includes('SSE')) {
          return new Response(JSON.stringify({ 
            error: "mcp_stream_error",
            message: "Error in SSE stream: " + errorMessage
          }), { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        throw streamError; // Re-throw for outer catch
      }
    } catch (clientError) {
      console.error('MCP client error:', clientError);
      
      // Handle token errors
      if (clientError.response?.status === 401 || 
          String(clientError).includes('unauthorized') || 
          String(clientError).includes('401')) {
        
        console.log('Authentication error detected, clearing tokens');
        // Force token refresh
        cookieStore.delete('cf_access_token');
        cookieStore.delete('cf_refresh_token');
        
        return Response.json({ 
          error: "token_expired",
          message: "Authentication token expired or invalid",
          authUrl: `${MCP_SERVER_URL}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}&response_type=code`
        }, { status: 401 });
      }
      
      throw clientError; // Re-throw for outer catch
    }
  } catch (error) {
    console.error('General API error:', error);
    
    // Format the error for frontend consumption
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    return new Response(JSON.stringify({ 
      error: "mcp_api_error",
      type: errorName,
      message: errorMessage
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}