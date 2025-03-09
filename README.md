# X ポール投稿ボット

X (旧Twitter) API v2を使用して、画像付きの投票ポストを自動投稿するTypeScriptボットです。

## 機能

- 実行時に即座にポール（投票）を投稿
- 最大4つまでの選択肢をカスタマイズ可能
- 画像の添付が可能
- 投票期間の設定が可能
- ハッシュタグの自動追加
- エラー発生時の自動リトライ機能
- 詳細なログ出力
- TypeScriptによる型定義完備

## 必要要件

- Node.js 14以上
- X Developer アカウント（API v2アクセス権限付き）
- X API認証情報（APIキー、シークレット、アクセストークン）

## X API設定手順

403エラーを防ぐため、X Developer Portalで以下の設定が必要です：

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
git clone https://github.com/yourusername/x-poll-bot.git
cd x-poll-bot
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

## ポールの設定

`src/config/polls.ts` でポールの内容を設定できます：

```typescript
export const polls: PollConfig[] = [
  {
    title: "What's your favorite programming language?",
    options: ['JavaScript', 'Python', 'Java', 'C++'],
    durationHours: 24,
    imagePath: path.join(process.cwd(), 'images', 'test.png'),
    hashtags: ['programming', 'coding', 'dev']
  },
  // 複数のポールを追加可能
  {
    title: "Which framework do you prefer?",
    options: ['React', 'Vue', 'Angular', 'Svelte'],
    durationHours: 48,
    hashtags: ['webdev', 'frontend']
  }
];
```

## ビルドと実行

TypeScriptコードのビルド：
```bash
npm run build
```

ボットの実行：
```bash
# デフォルトのポールを投稿（polls配列の最初のもの）
npm start

# 特定のポールを投稿（インデックスを指定）
npm start 1  # polls配列の2番目のポールを投稿
```

## プロジェクト構造

```
.
├── src/
│   ├── index.ts           # メインエントリーポイント
│   ├── TwitterPollBot.ts  # ボット実装
│   ├── config/
│   │   └── polls.ts      # ポール設定
│   └── utils/
│       └── logger.ts      # ログ設定
├── images/                # 画像ファイルディレクトリ
├── logs/                  # ログファイル
├── .env.example          # 環境変数テンプレート
├── .env                  # 環境変数（gitignore対象）
├── tsconfig.json        # TypeScript設定
└── README.md            # プロジェクトドキュメント
```

## 画像の設定

画像ファイルは以下のようにimagesディレクトリに配置します：

```
images/
  └── test.png  # ポールに添付する画像
```

対応している画像形式：
- PNG
- JPEG
- GIF
- WebP

サイズ制限：5MB以下

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

### 画像アップロードエラー
- サポートされている画像形式を使用しているか確認
- ファイルサイズが制限を超えていないか確認
- ファイルパスが正しく、読み取り権限があるか確認

## セキュリティ対策

1. **環境変数の管理**
   - `.env`ファイルはGitにコミットしない
   - 認証情報は環境変数で管理
   - APIキーは定期的にローテーション

2. **エラーハンドリング**
   - すべてのAPI呼び出しはtry-catchで保護
   - エラーは適切にログ出力
   - 一時的なエラーは自動リトライ

3. **レート制限対応**
   - X APIのレート制限を考慮
   - エクスポネンシャルバックオフによるリトライ

4. **ログ管理**
   - 機密情報はログに出力しない
   - ログファイルはローテーション
   - 環境に応じたログレベル設定

## ライセンス

ISC

## 貢献方法

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成
