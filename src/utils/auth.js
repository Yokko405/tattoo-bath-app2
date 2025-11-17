/**
 * Simple password protection for the app
 */

const APP_PASSWORD = 'tattoo2025'; // パスワードを変更してください
const PASSWORD_KEY = 'tattoo-bath-auth';

export function checkAuth() {
  const stored = sessionStorage.getItem(PASSWORD_KEY);
  if (stored === APP_PASSWORD) {
    return true;
  }

  const password = prompt('パスワードを入力してください：');
  if (password === APP_PASSWORD) {
    sessionStorage.setItem(PASSWORD_KEY, password);
    return true;
  }

  alert('パスワードが正しくありません');
  return false;
}

export function clearAuth() {
  sessionStorage.removeItem(PASSWORD_KEY);
}
