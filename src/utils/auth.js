/**
 * Authentication utilities for Cloudflare Workers API
 */

import { setSessionToken, getSessionToken, clearSessionToken } from './storage.js';

// API_BASE_URLは絶対URLである必要があります（相対パスではない）
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 絶対URLでない場合（相対パスの場合）、空文字列にする
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  // デバッグ用：開発環境でのみ警告を表示
  if (import.meta.env.DEV) {
    console.warn('VITE_API_BASE_URL must be an absolute URL (starting with http:// or https://)', {
      value: API_BASE_URL,
      type: typeof API_BASE_URL,
    });
  }
  API_BASE_URL = '';
}

// デバッグ出力: ビルド時に読み込まれているAPIベースURL
console.log('[auth] API_BASE_URL =', API_BASE_URL);

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function checkAuthStatus() {
  try {
    // まずセッションストレージを確認（Cookie がブロックされている場合のフォールバック）
    const localSessionToken = getSessionToken();
    if (localSessionToken) {
      console.log('[auth] Found session token in sessionStorage, returning true');
      return true;
    }

    if (!API_BASE_URL) {
      console.log('[auth] checkAuthStatus skipped: API_BASE_URL not set');
      return false;
    }
    const statusUrl = `${API_BASE_URL}/api/auth/status`;
    console.log('[auth] fetching auth status from', statusUrl);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      credentials: 'include',
    });

    console.log('[auth] status response status =', response.status);
    
    if (!response.ok) {
      try {
        const text = await response.text();
        console.log('[auth] status response body (non-ok) =', text);
      } catch (e) {}
      return false;
    }

    const data = await response.json();
    console.log('[auth] status response authenticated:', data.authenticated === true);
    return data.authenticated === true;
  } catch (error) {
    console.error('[auth] Auth status check failed:', error);
    return false;
  }
}

/**
 * Login with password
 * @param {string} password - Password to login
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function login(password) {
  try {
    if (!API_BASE_URL) {
      console.error('[auth] API_BASE_URL not configured');
      return {
        success: false,
        message: 'API URLが設定されていません',
      };
    }
    const loginUrl = `${API_BASE_URL}/api/auth/login`;
    console.log('[auth] POST login to', loginUrl);
    console.log('[auth] Sending password, length:', password.length);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    console.log('[auth] login response status =', response.status);
    console.log('[auth] login response ok =', response.ok);
    console.log('[auth] response headers:', {
      'content-type': response.headers.get('content-type'),
      'set-cookie': response.headers.get('set-cookie'),
    });

    // レスポンスがJSONかどうか確認
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[auth] Non-JSON response:', text);
      return {
        success: false,
        message: 'サーバーエラーが発生しました',
      };
    }

    const data = await response.json();
    console.log('[auth] login response data:', data);
    console.log('[auth] cookies after login attempt:', document.cookie);

    if (!response.ok) {
      console.log('[auth] login failed with status', response.status, ':', data);
      return {
        success: false,
        message: data.message || 'ログインに失敗しました',
      };
    }

    console.log('[auth] login successful');
    console.log('[auth] cookies after login:', document.cookie);
    
    // Safari iOS ではクロスオリジン Cookie がブロックされるため、
    // セッショントークンをセッションストレージにも保存
    if (data.success) {
      setSessionToken('authenticated');
      console.log('[auth] Session token saved to sessionStorage');
    }
    
    return {
      success: true,
      message: data.message || 'ログイン成功',
    };
  } catch (error) {
    console.error('[auth] Login error:', error);
    console.error('[auth] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      message: `ログインに失敗しました: ${error.message}`,
    };
  }
}

/**
 * Logout
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function logout() {
  try {
    // セッションストレージのトークンをクリア
    clearSessionToken();

    if (!API_BASE_URL) {
      return {
        success: false,
        message: 'API URLが設定されていません',
      };
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    console.log('[debug][auth] logout response status =', response.status);

    // レスポンスがJSONかどうか確認
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return {
        success: false,
        message: 'サーバーエラーが発生しました',
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'ログアウトに失敗しました',
      };
    }

    console.log('[debug][auth] logout response json =', data);
    return {
      success: true,
      message: data.message || 'ログアウト成功',
    };
  } catch (error) {
    console.error('Logout failed:', error);
    return {
      success: false,
      message: 'ログアウトに失敗しました',
    };
  }
}

