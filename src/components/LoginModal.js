/**
 * Login Modal Component
 */

export class LoginModal {
  constructor(container, onLoginSuccess) {
    this.container = container;
    this.onLoginSuccess = onLoginSuccess;
    this.isVisible = false;
  }

  show() {
    this.isVisible = true;
    this.render();
  }

  hide() {
    this.isVisible = false;
    this.container.innerHTML = '';
  }

  render() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
      <div class="login-modal-overlay"></div>
      <div class="login-modal-content">
        <div class="login-modal-header">
          <h2>🔒 ログイン</h2>
          <button class="login-modal-close" aria-label="閉じる">&times;</button>
        </div>
        <div class="login-modal-body">
          <p class="login-modal-description">このサイトにアクセスするにはパスワードが必要です</p>
          <form class="login-form" id="login-form">
            <div class="login-form-group">
              <label for="password">パスワード</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="パスワードを入力" 
                required 
                autofocus
              />
            </div>
            <div id="login-error" class="login-error" style="display: none;"></div>
            <button type="submit" class="login-submit-btn">ログイン</button>
          </form>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(modal);

    // Event listeners
    const form = modal.querySelector('#login-form');
    const closeBtn = modal.querySelector('.login-modal-close');
    const overlay = modal.querySelector('.login-modal-overlay');
    const errorDiv = modal.querySelector('#login-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(form, errorDiv);
    });

    closeBtn.addEventListener('click', () => this.hide());
    overlay.addEventListener('click', () => this.hide());

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  async handleLogin(form, errorDiv) {
    const passwordInput = form.querySelector('#password');
    const password = passwordInput.value;
    const submitBtn = form.querySelector('.login-submit-btn');

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'ログイン中...';
    errorDiv.style.display = 'none';

    try {
      const { login } = await import('../utils/auth.js');
      const result = await login(password);

      if (result.success) {
        this.hide();
        if (this.onLoginSuccess) {
          this.onLoginSuccess();
        }
      } else {
        errorDiv.textContent = result.message || 'パスワードが正しくありません';
        errorDiv.style.display = 'block';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = 'ログインに失敗しました。もう一度お試しください。';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ログイン';
    }
  }
}

