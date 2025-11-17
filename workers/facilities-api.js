/**
 * Cloudflare Workers API for facilities data
 * This worker serves the facilities.json data with proper CORS headers and password authentication
 */

// セッション有効期限（24時間）
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// 開発用デフォルトパスワード
const DEFAULT_DEV_PASSWORD = 'dev-password-123';

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

    // 開発環境では localhost/127.0.0.1 の任意ポートを許可する（credentials を伴うリクエストはワイルドカード不可なため）
    let allowedOrigin = '*';
    if (origin) {
      const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
        allowedOrigin = origin;
      }
    }

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': allowedOrigin !== '*' ? 'true' : 'false',
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

/**
 * Handle login request
 */
async function handleLogin(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    // リクエストのオリジンをここで取得（fetch内の変数はこのスコープでは参照できないため）
    const origin = request.headers.get('Origin');
    const body = await request.json();
    const { password } = body;

    // 環境変数からパスワードを取得（シークレットとして設定）
    // 未設定の場合は開発用デフォルト値を利用する
    const configuredPassword = env.PASSWORD && env.PASSWORD.trim();
    const correctPassword = configuredPassword || DEFAULT_DEV_PASSWORD;

    if (password !== correctPassword) {
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

    // セッションIDを生成してハッシュ化
    const sessionId = generateSessionId();
    const hashedSessionId = await hashSessionId(sessionId);

    // セッションCookieを設定（開発用：KVストア不要）
    // クロスオリジンリクエストの場合はSameSite=NoneとSecureが必要
    const isSecure = url.protocol === 'https:';
    const isCrossOrigin = origin && !origin.includes(url.hostname);
    const sameSite = isCrossOrigin && isSecure ? 'SameSite=None' : 'SameSite=Lax';
    const cookie = `session=${hashedSessionId}; HttpOnly; ${isSecure ? 'Secure;' : ''} ${sameSite}; Max-Age=${Math.floor(SESSION_DURATION / 1000)}; Path=/`;

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
    console.error('Login error:', error);
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
    const sameSite = isCrossOrigin && isSecure ? 'SameSite=None' : 'SameSite=Lax';
    
    // セッションCookieを削除（開発用：KVストア不要）
    const cookie = `session=; HttpOnly; ${isSecure ? 'Secure;' : ''} ${sameSite}; Max-Age=0; Path=/`;

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
