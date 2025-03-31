import { NextResponse } from 'next/server';

const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';

// Global client ID cache
declare global {
  var registeredClientId: string | undefined;
}

export const runtime = "edge";

export async function GET() {
  try {
    // Return cached client_id if available
    if (global.registeredClientId) {
      return NextResponse.json({ 
        success: true, 
        client_id: global.registeredClientId
      });
    }
    
    const registrationData = {
      redirect_uris: [`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`],
      client_name: "Next.js MCP Client",
      client_uri: process.env.NEXT_PUBLIC_BASE_URL,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none"
    };
    
    const response = await fetch(`${MCP_SERVER_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });
    
    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }
    
    const data = await response.json();
    global.registeredClientId = data.client_id;
    
    return NextResponse.json({ 
      success: true, 
      client_id: data.client_id
    });
  } catch (error) {
    console.error("Client registration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
