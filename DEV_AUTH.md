# 開発段階用認証セットアップ（簡易版）

開発段階で知っている人にしか公開しないための、シンプルなパスワード認証のセットアップ方法です。

## 特徴

- ✅ **KVストア不要** - セッション管理はCookieベース
- ✅ **簡単セットアップ** - パスワードを設定するだけ
- ✅ **開発環境対応** - ローカル開発でも動作

## セットアップ手順

### 1. パスワードの設定

#### 開発環境（ローカル）

`wrangler.toml`の`[vars]`セクションでパスワードを設定：

```toml
[vars]
PASSWORD = "あなたのパスワード"
```

または、環境変数で設定：

```bash
export PASSWORD="あなたのパスワード"
```

#### 本番環境（Cloudflare Workers）

シークレットとして設定（推奨）：

```bash
wrangler secret put PASSWORD
```

プロンプトでパスワードを入力します。

### 2. フロントエンドの環境変数設定

`.env`ファイルを作成または編集：

```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

ローカル開発の場合：

```env
VITE_API_BASE_URL=http://localhost:8787
```

### 3. Workersの起動（開発環境）

```bash
# ローカルでWorkersを起動
wrangler dev

# または、npmスクリプトを使用
npm run dev
```

### 4. 動作確認

1. ブラウザでアプリにアクセス
2. ログインモーダルが表示されることを確認
3. 設定したパスワードでログインできることを確認

## パスワードの変更方法

### 開発環境

`wrangler.toml`を編集：

```toml
[vars]
PASSWORD = "新しいパスワード"
```

### 本番環境

```bash
wrangler secret put PASSWORD
```

## セキュリティについて

### 開発段階での注意事項

- パスワードは`wrangler.toml`に直接書いても問題ありません（開発用）
- セッションは24時間有効です
- Cookieベースの簡易認証のため、セッションはCookieに保存されます

### 本番環境への移行時

1. **必ずシークレットを使用**
   ```bash
   wrangler secret put PASSWORD
   ```

2. **HTTPSの使用**
   - 本番環境では必ずHTTPSを使用してください
   - Cookieの`Secure`フラグが自動的に有効になります

3. **KVストアの導入（オプション）**
   - より堅牢なセッション管理が必要な場合、KVストアを追加できます
   - `AUTH_SETUP.md`を参照してください

## トラブルシューティング

### ログインできない

- パスワードが正しく設定されているか確認
- ブラウザのコンソールでエラーを確認
- Workersが正常に起動しているか確認

### セッションが保持されない

- Cookieが有効になっているか確認（ブラウザの設定）
- 開発環境では`SameSite=Lax`を使用（クロスオリジンリクエストの場合は`SameSite=None`が必要）

### ローカル開発で動作しない

- `wrangler dev`でWorkersを起動しているか確認
- `VITE_API_BASE_URL`が正しく設定されているか確認

## デフォルトパスワード

開発用のデフォルトパスワードは `dev-password-123` です。

- Workers 側で `PASSWORD` が未設定の場合、自動的にこの値が使用されます。
- `wrangler secret put PASSWORD` で任意の値を入れると、即座にそちらが優先されます。

**重要**: 本番環境では必ず変更してください！

