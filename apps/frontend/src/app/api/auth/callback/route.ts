import { NextResponse } from 'next/server';

const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';
const OAUTH_CLIENT_ID: string = process.env.MCP_CLIENT_ID ?? '';
const OAUTH_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=${error || 'missing_code'}`, request.url));
  }
  
  try {
    console.log('Exchanging code for token with params:', {
      code: code?.substring(0, 10) + '...',
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_REDIRECT_URI
    });
    
    const tokenResponse = await fetch(`${MCP_SERVER_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT_URI,
      }).toString(),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`Token exchange failed: Status ${tokenResponse.status}, Response: ${errorText}`);
      return NextResponse.redirect(
        new URL(`/?error=token_exchange_failed&status=${tokenResponse.status}&details=${encodeURIComponent(errorText)}`, request.url)
      );
    }
    
    let tokenData;
    try {
      tokenData = await tokenResponse.json();
    } catch (e) {
      console.error('Failed to parse token response:', e);
      return NextResponse.redirect(new URL(`/?error=invalid_token_response`, request.url));
    }
    
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // redirect to chat page
    const response = NextResponse.redirect(new URL('/chat', request.url));
    
    response.headers.set(
      'Set-Cookie', 
      `cf_access_token=${access_token}; Path=/; HttpOnly; Secure; Max-Age=${expires_in}`
    );
    
    if (refresh_token) {
      response.headers.append(
        'Set-Cookie', 
        `cf_refresh_token=${refresh_token}; Path=/; HttpOnly; Secure; Max-Age=${30 * 24 * 60 * 60}`
      );
    }
    
    return response;
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/?error=oauth_failure&message=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}