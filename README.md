# Tattoo Bath App 2.0

全国のタトゥーOKな温泉・銭湯を簡単に検索できるWebアプリケーション

## 特徴

- **施設検索**: 名前、地域、キーワードで検索
- **地図表示**: Google Maps APIを使用した視覚的な施設位置表示
- **フィルタリング**: 都道府県、タグ、お気に入りでの絞り込み
- **現在地検索**: 現在地から近い施設を検索
- **お気に入り機能**: LocalStorageを使用したお気に入り管理
- **PWA対応**: オフライン対応、ホーム画面追加可能
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップ対応

## 技術スタック

- **フロントエンド**: Vanilla JavaScript + Vite
- **地図**: Google Maps JavaScript API
- **データ管理**: 静的JSON (将来的にCloudflare KV対応)
- **API**: Cloudflare Workers
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
│   │   └── MapView.js           # 地図表示
│   ├── utils/
│   │   ├── api.js               # API呼び出し
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

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

### 4. ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## デプロイ

### Cloudflare Pagesへのデプロイ

1. Cloudflare Pagesダッシュボードでプロジェクトを作成
2. GitHubリポジトリを接続
3. ビルド設定:
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `dist`
   - ルートディレクトリ: `/`

### Cloudflare Workersのデプロイ

```bash
npm run deploy
```

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
