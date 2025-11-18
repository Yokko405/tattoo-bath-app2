/**
 * Cloudflare Workers API for facilities data
 * This worker serves the facilities.json data with proper CORS headers and password authentication
 */

// セッション有効期限（24時間）
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// セッションIDを生成
function generateSessionId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// CookieからセッションIDを取得
function getSessionId(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1];
}

// セッションIDをハッシュ化（Cookieに保存するため）
async function hashSessionId(sessionId) {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// セッションが有効かチェック（開発用簡易実装）
// KVストアなしでも動作するように、CookieのセッションIDの形式をチェック
async function isValidSession(sessionId) {
  if (!sessionId) return false;
  // SHA-256ハッシュの長さ（64文字）をチェック
  // 開発段階では、セッションIDが正しい形式であれば有効とみなす
  return sessionId.length === 64;
}

// 認証が必要なリクエストかチェック
function requiresAuth(pathname) {
  // 認証エンドポイントは認証不要
  if (pathname.startsWith('/api/auth/')) return false;
  // その他のAPIエンドポイントは認証必要
  if (pathname.startsWith('/api/')) return true;
  return false;
}

// 認証チェック
async function checkAuth(request) {
  const sessionId = getSessionId(request);
  return await isValidSession(sessionId);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // リクエストのオリジンを取得（CORS用）
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://yokko405.github.io',
      'https://Yokko405.github.io',
    ];

    // 認証エンドポイント（/api/auth/）でのCORS処理
    // - Originヘッダーがあればそれに対応、なければワイルドカード（*）を使用
    // - スマートフォン（特にSafari）ではOriginヘッダーが送信されないことがあるため、オプショナル対応
    const isAuthEndpoint = url.pathname.startsWith('/api/auth/');
    
    let allowedOrigin = '*';
    let credentialsAllowed = false;
    
    if (origin) {
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
        allowedOrigin = origin;
        credentialsAllowed = true;
      }
    }
    
    // デバッグログ
    console.log(`[API] Method: ${request.method}, Path: ${url.pathname}, Origin: ${origin || 'none'}`);
    
    // 認証エンドポイントではOriginヘッダーがない場合でもリクエストを許可（スマートフォン対応）
    // Originがない場合はワイルドカード（*）で対応

    // CORS headers
    // 認証エンドポイント：Originがあれば指定、なければワイルドカード
    // その他：設定されたallowedOriginを使用
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAuthEndpoint ? (origin && allowedOrigin !== '*' ? allowedOrigin : '*') : allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': (isAuthEndpoint || credentialsAllowed) && allowedOrigin !== '*' ? 'true' : 'false',
    };

    // Handle OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // 認証エンドポイント
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env, corsHeaders);
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request, env, corsHeaders);
    }

    if (url.pathname === '/api/auth/status' && request.method === 'GET') {
      return handleAuthStatus(request, env, corsHeaders);
    }

    // 認証が必要なエンドポイントのチェック
    if (requiresAuth(url.pathname)) {
      const isAuthenticated = await checkAuth(request);
      if (!isAuthenticated) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: '認証が必要です' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    }

    // API Routes
    if (url.pathname === '/api/facilities') {
      return handleFacilitiesRequest(env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/facility/')) {
      const id = url.pathname.split('/').pop();
      return handleFacilityByIdRequest(id, env, corsHeaders);
    }

    // Default response
    return new Response('Tattoo Bath App API', {
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    });
  },
};

/**
 * Handle request for all facilities
 */
async function handleFacilitiesRequest(env, corsHeaders) {
  try {
    // In production, you would fetch from KV storage:
    // const data = await env.FACILITIES_KV.get('facilities', { type: 'json' });

    // For now, return a basic response
    // The actual data is served from the static JSON file
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Use /data/facilities.json for facility data',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch facilities' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Handle request for a specific facility by ID
 */
async function handleFacilityByIdRequest(id, env, corsHeaders) {
  try {
    // In production, you would fetch from KV storage:
    // const facility = await env.FACILITIES_KV.get(`facility:${id}`, { type: 'json' });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Facility ${id} - Use client-side filtering for now`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch facility' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

async function handleLogin(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    // リクエストのオリジンをここで取得
    const origin = request.headers.get('Origin');
    const body = await request.json();
    const { password } = body;

    console.log(`[Login] Origin: ${origin || 'none'}, Password: ${password ? 'provided' : 'missing'}`);

    // 環境変数からパスワードを取得（シークレットとして設定）
    // シークレットが未設定の場合はエラーを返す
    if (!env.PASSWORD || !env.PASSWORD.trim()) {
      console.error('PASSWORD secret is not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', message: 'サーバーの設定に問題があります' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const correctPassword = env.PASSWORD.trim();

    if (password !== correctPassword) {
      console.log(`[Login] Password mismatch`);
      return new Response(
        JSON.stringify({ error: 'Invalid password', message: 'パスワードが正しくありません' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log(`[Login] Password matched, generating session`);

    // セッションIDを生成してハッシュ化
    const sessionId = generateSessionId();
    const hashedSessionId = await hashSessionId(sessionId);

    // セッションCookieを設定
    // GitHub Pages（HTTPS）からのリクエストに対応するため、SameSite=None; Secure を設定
    // スマートフォン（Safari/Chrome）でも動作するようにCookie設定を調整
    const isSecure = url.protocol === 'https:';
    
    // Cookieの属性を配列で組み立てる
    const cookieParts = [`session=${hashedSessionId}`];
    cookieParts.push('HttpOnly');
    if (isSecure) {
      cookieParts.push('Secure');
      // クロスオリジン（GitHub Pages）でも動作するようにSameSite=Noneを設定
      // ただしSecureと一緒に設定する必要がある
      cookieParts.push('SameSite=None');
    } else {
      cookieParts.push('SameSite=Lax');
    }
    cookieParts.push(`Max-Age=${Math.floor(SESSION_DURATION / 1000)}`);
    cookieParts.push('Path=/');
    const cookie = cookieParts.join('; ');

    console.log(`[Login] Setting cookie: ${cookieParts.join('; ')}`);

    return new Response(
      JSON.stringify({ success: true, message: 'ログイン成功' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[Login] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Login failed', message: 'ログインに失敗しました' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Handle logout request
 */
async function handleLogout(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const isSecure = url.protocol === 'https:';
    const isCrossOrigin = origin && !origin.includes(url.hostname);
    
    // Cookieの削除属性を配列で組み立てる
    const cookieParts = ['session='];
    cookieParts.push('HttpOnly');
    if (isSecure) {
      cookieParts.push('Secure');
      if (isCrossOrigin) {
        cookieParts.push('SameSite=None');
      } else {
        cookieParts.push('SameSite=Lax');
      }
    }
    cookieParts.push('Max-Age=0');
    cookieParts.push('Path=/');
    const cookie = cookieParts.join('; ');

    return new Response(
      JSON.stringify({ success: true, message: 'ログアウト成功' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: 'Logout failed', message: 'ログアウトに失敗しました' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

/**
 * Handle auth status check
 */
async function handleAuthStatus(request, env, corsHeaders) {
  try {
    const isAuthenticated = await checkAuth(request);

    return new Response(
      JSON.stringify({ authenticated: isAuthenticated }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Auth status error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Failed to check auth status' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
