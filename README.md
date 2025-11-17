# Tattoo Bath App 2.0

全国のタトゥーOKな温泉・銭湯を簡単に検索できるWebアプリケーション

**🌐 アプリURL**: https://Yokko405.github.io/tattoo-bath-app2/

## 特徴

- **施設検索**: 名前、地域、キーワードで検索
- **地図表示**: Google Maps APIを使用した視覚的な施設位置表示
- **フィルタリング**: 都道府県、タグ、お気に入りでの絞り込み
- **現在地検索**: 現在地から近い施設を検索
- **お気に入り機能**: LocalStorageを使用したお気に入り管理
- **パスワード認証**: Cloudflare Workersによるセキュアな認証（オプション）
- **PWA対応**: オフライン対応、ホーム画面追加可能
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップ対応

## 技術スタック

- **フロントエンド**: Vanilla JavaScript + Vite
- **地図**: Google Maps JavaScript API
- **データ管理**: 静的JSON (将来的にCloudflare KV対応)
- **API**: Cloudflare Workers
- **認証**: Cloudflare Workers + KVストア（セッション管理）
- **PWA**: Service Worker + Web App Manifest

## プロジェクト構造

```
tattoo-bath-app/
├── public/
│   ├── data/
│   │   └── facilities.json      # 施設マスタデータ
│   ├── images/
│   │   └── icons/               # PWAアイコン
│   ├── manifest.json            # PWA設定
│   └── sw.js                    # Service Worker
├── src/
│   ├── components/
│   │   ├── SearchBar.js         # 検索バー
│   │   ├── FilterPanel.js       # フィルターUI
│   │   ├── FacilityCard.js      # 施設カード
│   │   ├── FacilityDetail.js    # 施設詳細モーダル
│   │   ├── MapView.js           # 地図表示
│   │   └── LoginModal.js        # ログインモーダル
│   ├── utils/
│   │   ├── api.js               # API呼び出し
│   │   ├── auth.js              # 認証ユーティリティ
│   │   ├── storage.js           # LocalStorage管理
│   │   └── geo.js               # 位置情報処理
│   ├── styles/
│   │   └── main.css             # メインスタイル
│   ├── main.js                  # エントリーポイント
│   └── index.html
├── workers/
│   └── facilities-api.js        # Cloudflare Workers API
├── vite.config.js
├── wrangler.toml               # Cloudflare Workers設定
└── package.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Google Maps APIキーの設定

**重要**: APIキーは環境変数で管理します（セキュリティのため）

1. `.env`ファイルを作成:
```bash
cp .env.example .env
```

2. `.env`ファイルを編集:
```env
VITE_GOOGLE_MAPS_API_KEY=あなたのAPIキー
```

3. Google Maps APIキーの取得・設定方法:
   - [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
   - 「Maps JavaScript API」を有効化
   - 認証情報でAPIキーを作成
   - **必須**: APIキーに制限を設定
     - アプリケーション制限: HTTPリファラー
     - 許可するウェブサイト: `localhost:3000/*`, `yourdomain.com/*`
     - API制限: Maps JavaScript APIのみ

⚠️ **セキュリティ注意事項**:
- `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- フロントエンドのAPIキーは完全には隠せませんが、以下で保護:
  - ドメイン制限（リファラー制限）
  - API使用量制限の設定
  - 請求アラートの設定

### 3. Cloudflare Workers認証の設定（開発段階用・簡易版）

開発段階で知っている人にしか公開しないための、シンプルなパスワード認証:

1. **パスワードの設定**
   
   `wrangler.toml`を編集してパスワードを設定:
   ```toml
   [vars]
   PASSWORD = "あなたのパスワード"
   ```
   
   または、本番環境ではシークレットとして設定（推奨）:
   ```bash
   wrangler secret put PASSWORD
   ```

2. **環境変数の設定**
   
   `.env`ファイルを作成:
   ```env
   VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
   ```
   
   ローカル開発の場合:
   ```env
   VITE_API_BASE_URL=http://localhost:8787
   ```

3. **Workersの起動（開発環境）**
   ```bash
   wrangler dev
   ```

4. **Workersのデプロイ（本番環境）**
   ```bash
   npm run deploy
   # または
   wrangler deploy
   ```

**注意**: 開発段階用の簡易認証です。KVストアは不要で、Cookieベースのセッション管理を使用します。

詳細は `DEV_AUTH.md` を参照してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### 5. ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## デプロイ

### GitHub Pagesへのデプロイ

1. **GitHubリポジトリの設定**
   - Settings → Pages → Source を "GitHub Actions" に設定

2. **Google Maps APIキーをSecretsに追加**
   - Settings → Secrets and variables → Actions
   - New repository secret をクリック
   - Name: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: あなたのGoogle Maps APIキー

3. **デプロイ**
   - `main`または`master`ブランチにプッシュすると自動デプロイ
   - または Actions タブから手動実行

4. **公開URL**
   - `https://Yokko405.github.io/tattoo-bath-app2/`

### 手動ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## データ管理

### 施設データの追加・編集

`public/data/facilities.json` を編集:

```json
{
  "id": "fac-XXX",
  "name": "施設名",
  "slug": "facility-slug",
  "prefecture": "都道府県",
  "city": "市区町村",
  "address": "住所",
  "lat": 35.6812,
  "lng": 139.7671,
  "tags": ["温泉", "サウナ"],
  "tattooPolicy": "全面OK",
  "description": "説明文",
  "website": "https://example.com",
  "phone": "03-1234-5678",
  "hours": "10:00-23:00",
  "price": "1500円",
  "lastVerified": "2025-11-16",
  "images": []
}
```

## 機能ロードマップ

### Phase 1 (MVP) - 完了
- ✅ 施設検索（名前、エリア、タグ）
- ✅ 地図表示＋マーカー
- ✅ 施設詳細表示
- ✅ 都道府県・タグフィルター
- ✅ レスポンシブデザイン
- ✅ お気に入り機能
- ✅ PWA対応

### Phase 2 (拡張)
- 現在地から近い施設検索の改善
- 施設個別ページ（SEO対策）
- OGP対応
- 多言語対応（英語）

### Phase 3 (コミュニティ機能)
- ユーザー投稿フォーム
- レビュー・評価システム
- 施設情報の更新リクエスト

## ライセンス

MIT License

## 貢献

プルリクエスト歓迎！

施設情報の更新や新規追加は、issueまたはPRでお願いします。

## 注意事項

- 施設情報は定期的に更新していますが、変更される場合があります
- 訪問前に必ず施設に確認することをお勧めします
- Google Maps APIの使用には料金が発生する場合があります
