# Twitter ポール投稿ボット

Twitter/X API v2を使用して、投票付きツイートを自動投稿するTypeScriptボットです。

## 機能

- 実行時に即座にポール（投票）を投稿
- 最大4つまでの選択肢をカスタマイズ可能
- 投票期間の設定が可能
- エラー発生時の自動リトライ機能
- 詳細なログ出力
- TypeScriptによる型定義完備

## 必要要件

- Node.js 14以上
- Twitter Developer アカウント（API v2アクセス権限付き）
- Twitter API認証情報（APIキー、シークレット、アクセストークン）

## Twitter API設定手順

403エラーを防ぐため、Twitter Developer Portalで以下の設定が必要です：

1. User authentication settings にて：
   - OAuth 1.0a を有効化
   - App permissions を "Read and write" に設定
   - Type of App を "Native App" に設定
   - Callback URL に `http://127.0.0.1` を設定
   - Website URL には以下のいずれかを設定：
     * GitHubリポジトリURL（推奨）
     * `http://127.0.0.1`（開発用）
     * `https://example.com`（テスト用）

2. Keys and tokens にて：
   - Consumer Keys (APIキーとシークレット)を取得
   - Access Token and Secret を生成
     * 生成時に"Read and write"権限を付与することを確認
     * 権限を変更した場合は、新しいトークンを生成する必要があります

## インストール方法

1. リポジトリのクローン：
```bash
git clone https://github.com/yourusername/twitter-poll-bot.git
cd twitter-poll-bot
```

2. 依存パッケージのインストール：
```bash
npm install
```

3. 環境変数テンプレートのコピー：
```bash
cp .env.example .env
```

4. `.env`ファイルの設定：
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
POLL_DEFAULT_DURATION_HOURS=24
LOG_LEVEL=info
```

## ビルドと実行

TypeScriptコードのビルド：
```bash
npm run build
```

ボットの実行（即座にポールを投稿）：
```bash
npm start
```

## 使用例

### 基本的な使用方法

```typescript
import TwitterPollBot from './src/TwitterPollBot.js';

const bot = new TwitterPollBot({
  apiKey: process.env.TWITTER_API_KEY!,
  apiSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
  defaultDurationHours: 24
});

// ポールの投稿
await bot.createPoll({
  title: "好きなプログラミング言語は？",
  options: ['JavaScript', 'Python', 'Java', 'C++'],
  durationHours: 24
});
```

## プロジェクト構造

```
.
├── src/
│   ├── index.ts           # メインエントリーポイント
│   ├── TwitterPollBot.ts  # ボット実装
│   └── utils/
│       └── logger.ts      # ログ設定
├── dist/                  # コンパイル済みJavaScriptファイル
├── logs/                  # ログファイル
├── .env.example          # 環境変数テンプレート
├── .env                  # 環境変数（gitignore対象）
├── tsconfig.json        # TypeScript設定
└── README.md            # プロジェクトドキュメント
```

## 型定義

主要なコンポーネントの型定義：

```typescript
interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  defaultDurationHours?: number;
}

interface PollData {
  title: string;
  options: string[];
  durationHours?: number;
}
```

## エラーハンドリング

よくあるエラーとその対処方法：

### 403 Forbidden エラー
以下を確認してください：
- App permissions が "Read and write" に設定されているか
- OAuth 1.0a が有効になっているか
- アクセストークンが正しい権限で生成されているか
- Type of App が "Native App" に設定されているか
- Callback URL が `http://127.0.0.1` に設定されているか

### 401 Unauthorized エラー
以下を確認してください：
- APIキーとシークレットが正しいか
- アクセストークンが有効期限切れでないか
- トークンが取り消されていないか

### 429 Rate Limit エラー
- API制限に達した場合は、しばらく待ってから再試行
- ボットには自動リトライ機能が組み込まれています
