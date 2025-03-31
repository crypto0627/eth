import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// OAuth 配置
const MCP_SERVER_URL = 'https://mcp-remote-server.jake0627a1.workers.dev';
let OAUTH_CLIENT_ID = process.env.CLOUDFLARE_OAUTH_CLIENT_ID;
const OAUTH_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

// 从全局状态获取 client_id（如果已注册）
if (global.registeredClientId) {
  OAUTH_CLIENT_ID = global.registeredClientId;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=${error || 'missing_code'}`, request.url));
  }
  
  try {
    // 交換授權碼獲取訪問令牌
    const tokenResponse = await fetch(`${MCP_SERVER_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: OAUTH_CLIENT_ID!,
        redirect_uri: OAUTH_REDIRECT_URI,
      }).toString(),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // 將令牌存儲在 HTTP-only cookie 中
    (await cookies()).set('cf_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expires_in,
      path: '/',
    });
    
    if (refresh_token) {
      (await cookies()).set('cf_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30天
        path: '/',
      });
    }
    
    // 重定向回應用
    return NextResponse.redirect(new URL('/chat', request.url));
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL(`/?error=oauth_failure`, request.url));
  }
}