/**
 * Authentication utilities for Cloudflare Workers API
 */

// API_BASE_URLは絶対URLである必要があります（相対パスではない）
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 絶対URLでない場合（相対パスの場合）、空文字列にする
if (API_BASE_URL && !API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  console.warn('VITE_API_BASE_URL must be an absolute URL (starting with http:// or https://)');
  API_BASE_URL = '';
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function checkAuthStatus() {
  try {
    if (!API_BASE_URL) {
      return false;
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('Auth status check failed:', error);
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
      return {
        success: false,
        message: 'API URLが設定されていません',
      };
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'ログインに失敗しました',
      };
    }

    return {
      success: true,
      message: data.message || 'ログイン成功',
    };
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      message: 'ログインに失敗しました。ネットワークエラーを確認してください。',
    };
  }
}

/**
 * Logout
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function logout() {
  try {
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

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'ログアウトに失敗しました',
      };
    }

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

