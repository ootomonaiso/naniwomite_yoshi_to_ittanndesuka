# なにを見て「ヨシ」と言ったんですか？

人狼系 品質検査マルチプレイゲーム

## ゲーム概要
- プレイヤーは**村人（品質管理者）**と**偽者（工作員）**に分かれます
- 各チームは異なる品質チェックリストを受け取ります
- 商品を評価して「ヨシ（採用）」か「ダメ（不採用）」で投票します
- 正規品を正しく判定できれば村人勝利、誤判定すると偽者勝利

## 技術スタック
- **フロントエンド**: React + CSS
- **バックエンド**: Firebase (Firestore + Authentication)
- **認証**: Google認証
- **デプロイ**: Vercel対応
- **リアルタイム通信**: Firestore リアルタイムリスナー

## 機能
- ✅ Google認証ログイン
- ✅ ルーム作成・参加システム
- ✅ リアルタイムマルチプレイ
- ✅ 役職自動割り当て（村人/偽者）
- ✅ 異なるチェックリスト配布
- ✅ 商品評価・投票システム
- ✅ リアルタイムチャット
- ✅ 勝敗判定システム
- ✅ レスポンシブデザイン

## セットアップ

### 1. 依存関係インストール
```bash
cd frontend
npm install
```

### 2. Firebase設定
1. [Firebase Console](https://console.firebase.google.com/)で新規プロジェクト作成
2. Authentication -> Google認証を有効化
3. Firestore Databaseを有効化
4. プロジェクト設定からAPIキーを取得

### 3. 環境変数設定
`frontend/.env`ファイルを作成：
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. 開発サーバー起動
```bash
npm start
```

## ゲームルール詳細

### 役職
- **村人（品質管理者）**: 正しい品質チェックリストを持つ
- **偽者（工作員）**: 微妙に異なるチェックリストを持つ

### 勝利条件
- **村人勝利**: 正規品を正しく採用 OR 偽物を正しく拒否
- **偽者勝利**: 正規品を拒否させる OR 偽物を採用させる

### ゲーム進行
1. ルーム作成・参加
2. 役職自動割り当て
3. 商品とチェックリストの確認
4. チャットで議論
5. 投票（ヨシ/ダメ）
6. 結果発表
7. 次ラウンドまたは最終結果

## デプロイ
```bash
npm run build
# Vercelにデプロイ
```

## ディレクトリ構成
```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.js          # 認証画面
│   │   ├── Lobby.js          # ロビー・ルーム管理
│   │   ├── Game.js           # メインゲーム画面
│   │   └── GameResult.js     # 結果画面
│   ├── firebase.js           # Firebase設定
│   ├── gameLogic.js          # ゲームロジック
│   ├── App.js               # メインアプリ
│   ├── App.css              # スタイル
│   └── index.js             # エントリーポイント
└── package.json
```
