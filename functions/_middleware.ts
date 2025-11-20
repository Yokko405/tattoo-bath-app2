/**
 * Cloudflare Pages用パスワード保護ミドルウェア
 * 
 * 使用方法:
 * 1. このファイルを functions/_middleware.ts として配置
 * 2. PASSWORD を環境変数または直接設定
 * 3. Cloudflare Pagesにデプロイ
 */

interface Env {
  PASSWORD?: string;
}

// パスワードはデフォルト値を設定しない（環境変数から取得必須）
const DEFAULT_PASSWORD = 'spa123'; // 開発環境用フォールバック

// セッション有効期限（24時間）
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// セッションIDを生成
function generateSessionId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// セッションIDをハッシュ化（Cookieに保存するため）
async function hashSessionId(sessionId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// CookieからセッションIDを取得
function getSessionId(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1];
}

// セッションが有効かチェック（簡易実装）
async function isValidSession(sessionId: string | null): Promise<boolean> {
  if (!sessionId) return false;
  return sessionId.length === 64; // SHA-256ハッシュの長さ
}

// ログインページのHTML
function getLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ログイン</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
      text-align: center;
    }
    p {
      color: #666;
      margin-bottom: 30px;
      text-align: center;
      font-size: 14px;
    }
    .error {
      background: #fee;
      color: #c33;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      text-align: center;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    input {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 16px;
      margin-bottom: 20px;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🔒 アクセス制限</h1>
    <p>このサイトはパスワードで保護されています</p>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="POST" action="/login">
      <input 
        type="password" 
        name="password" 
        placeholder="パスワードを入力" 
        required 
        autofocus
      />
      <button type="submit">ログイン</button>
    </form>
  </div>
</body>
</html>`;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // 環境変数からパスワードを取得（必須）
  const password = env.PASSWORD || DEFAULT_PASSWORD;
  
  // ログイン処理
  if (url.pathname === '/login' && request.method === 'POST') {
    const formData = await request.formData();
    const inputPassword = formData.get('password');
    
    if (inputPassword === password) {
      // セッションIDを生成
      const sessionId = generateSessionId();
      const hashedSessionId = await hashSessionId(sessionId);
      
      // セッションCookieを設定してリダイレクト
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': `session=${hashedSessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION / 1000}; Path=/`
        }
      });
      
      return response;
    } else {
      // パスワードが間違っている場合
      return new Response(getLoginPage('パスワードが正しくありません'), {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }
  
  // ログアウト処理
  if (url.pathname === '/logout') {
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': '/login',
        'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      }
    });
    return response;
  }
  
  // ログインページは常に表示
  if (url.pathname === '/login') {
    return new Response(getLoginPage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // セッション確認
  const sessionId = getSessionId(request);
  const isValid = await isValidSession(sessionId);
  
  if (!isValid) {
    // セッションが無効な場合、ログインページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/login'
      }
    });
  }
  
  // 認証成功、通常のリクエストを処理
  return next();
}
