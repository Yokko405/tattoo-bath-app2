# 認証セットアップガイド

このアプリにCloudflare Workersでパスワード認証を追加する手順です。

## 前提条件

- Cloudflareアカウント
- Wrangler CLIがインストール済み (`npm install -g wrangler`)
- Cloudflare Workersのデプロイ権限

## セットアップ手順

### 1. KVストアの作成

セッション管理用のKVストアを作成します。

```bash
# 本番環境用KVストア
wrangler kv:namespace create "SESSIONS_KV"

# 開発環境用KVストア（オプション）
wrangler kv:namespace create "SESSIONS_KV" --preview
```

コマンド実行後、以下のような出力が表示されます：

```
🌀  Creating namespace with title "tattoo-bath-app-SESSIONS_KV"
✨  Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SESSIONS_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 2. wrangler.tomlの更新

生成されたKVストアのIDを`wrangler.toml`に設定します。

```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 上記で生成されたID
```

開発環境用KVストアも作成した場合：

```toml
[[kv_namespaces]]
binding = "SESSIONS_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 本番環境用ID

[[kv_namespaces]]
binding = "SESSIONS_KV"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  # 開発環境用ID
```

### 3. パスワードの設定

本番環境用のパスワードをシークレットとして設定します。

```bash
wrangler secret put PASSWORD
```

プロンプトが表示されたら、使用するパスワードを入力します。

**重要**: パスワードは平文で保存されるため、強力なパスワードを使用してください。

### 4. 環境変数の設定

フロントエンドからWorkers APIにアクセスするためのベースURLを設定します。

`.env`ファイルに追加：

```env
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

または、本番環境の場合は環境変数として設定：

```bash
# GitHub ActionsなどのCI/CDで設定
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

### 5. Workersのデプロイ

```bash
npm run deploy
# または
wrangler deploy
```

### 6. 動作確認

1. ブラウザでアプリにアクセス
2. ログインモーダルが表示されることを確認
3. 設定したパスワードでログインできることを確認
4. ログイン後、アプリが正常に動作することを確認

## 認証エンドポイント

### POST /api/auth/login

ログイン処理

**リクエスト:**
```json
{
  "password": "your-password"
}
```

**レスポンス（成功）:**
```json
{
  "success": true,
  "message": "ログイン成功"
}
```

**レスポンス（失敗）:**
```json
{
  "error": "Invalid password",
  "message": "パスワードが正しくありません"
}
```

### POST /api/auth/logout

ログアウト処理

**レスポンス:**
```json
{
  "success": true,
  "message": "ログアウト成功"
}
```

### GET /api/auth/status

認証状態の確認

**レスポンス:**
```json
{
  "authenticated": true
}
```

## セキュリティ考慮事項

1. **パスワードの管理**
   - 本番環境では必ず`wrangler secret put`を使用
   - `.env`ファイルやコードに直接パスワードを書かない

2. **HTTPSの使用**
   - 本番環境では必ずHTTPSを使用
   - Cookieの`Secure`フラグが有効

3. **セッション管理**
   - セッションは24時間で自動期限切れ
   - KVストアに保存されるセッションは自動的に削除される

4. **CORS設定**
   - 本番環境では`Access-Control-Allow-Origin`を適切に設定
   - 現在は`*`（すべてのオリジン）を許可しているため、必要に応じて制限

## トラブルシューティング

### ログインモーダルが表示されない

- `VITE_API_BASE_URL`が設定されているか確認
- ブラウザのコンソールでエラーを確認
- Workersが正常にデプロイされているか確認

### ログインできない

- パスワードが正しく設定されているか確認: `wrangler secret list`
- KVストアが正しく設定されているか確認
- Workersのログを確認: `wrangler tail`

### セッションが保持されない

- Cookieが正しく設定されているか確認（ブラウザの開発者ツール）
- `SameSite=None`と`Secure`フラグが設定されているか確認
- クロスオリジンリクエストの場合、CORS設定を確認

## 参考リンク

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

