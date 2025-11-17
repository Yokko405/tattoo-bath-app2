/**
 * Authentication utilities for Cloudflare Workers API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function checkAuthStatus() {
  try {
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

