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

  // Set a longer timeout for the request
  const TIMEOUT_MS = 120000; // 120 seconds timeout (extended from 60s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  // Maximum retry attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  while (retryCount <= MAX_RETRIES) {
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
          setTimeout(() => reject(new Error('Tools fetch timeout')), 15000) // Extended from 10s
        )
      ]);
      
      // Create the response
      const response = await streamText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        tools: toolSet as any, // Type assertion to resolve the type error
        prompt,
        onFinish: () => {
          console.log('Stream finished');
          sseClient.close();
          clearTimeout(timeoutId);
        },
      }).toDataStreamResponse();
      
      // Check if response contains the error message
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      
      if (text === '3:"An error occurred."') {
        console.log(`Received error response, retrying (${retryCount + 1}/${MAX_RETRIES})`);
        retryCount++;
        
        if (retryCount <= MAX_RETRIES) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
          continue;
        }
      }
      
      // If we got here with a valid response, return it
      return response;
      
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
      
      // For other errors, retry if we haven't exceeded max retries
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        console.log(`Error occurred, retrying (${retryCount}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        continue;
      }
      
      return Response.json({ 
        error: "server_error",
        message: error.message || "Unknown error occurred"
      }, { status: 500 });
    }
  }
  
  // If we've exhausted all retries
  return Response.json({ 
    error: "max_retries_exceeded",
    message: "Maximum retry attempts exceeded"
  }, { status: 500 });
}