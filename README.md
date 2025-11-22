# EXIF Viewer Extension

この拡張機能は、外部サイトに画像を送信せずにEXIF情報を解析することを目指して作成しています。
**WASM (WebAssembly)** を使用して高速かつセキュアな画像解析を実現しています。

## 概要

この拡張機能は、Google ChromeでWebページ内の画像を外部に送信せずにEXIF情報を表示するための機能を提供します。
(外部送信しないので)インターネット接続なしで利用可能ですが、ローカルファイルは解析できません。

### 主な特徴

- **完全オフライン動作**: 画像データは一切外部に送信されません
- **WASM ベース**: Go言語で書かれたWASMモジュールによる高速EXIF解析
- **モダンUI**: Vanilla JavaScriptによるクリーンで使いやすいインターフェース
- **拡張可能**: PNG, WebP, HEIFなど、将来的な画像形式対応のためのインターフェースを実装

## 対応形式

### 現在対応している形式
- JPEG (完全対応)
- TIFF (完全対応)
- WebP (EXIF, XMP, ICC Profile, Animation対応) ✨ NEW

### 将来対応予定の形式
- PNG
- HEIF/HEIC

## インストール方法

### Chrome Web Storeから (準備中)

以下のURLからブラウザの拡張機能として追加してください。

* (申請準備中)

### 開発版のインストール

#### 1. ビルド環境の準備

**重要: バージョン要件**

このプロジェクトは、WASMコンパイルのために**厳密なバージョン**が必要です:
- **TinyGo 0.37.x** (0.37.0でテスト済み)
- **Go 1.22.12** (TinyGo 0.37との互換性のため必須)

**他のGoバージョンは使用しないでください** - TinyGo 0.37は他のバージョンでは正しく動作しません。

```bash
# TinyGo 0.37のインストール
# macOS (Homebrew)
brew install tinygo

# Linux (Debian/Ubuntu)
wget https://github.com/tinygo-org/tinygo/releases/download/v0.37.0/tinygo_0.37.0_amd64.deb
sudo dpkg -i tinygo_0.37.0_amd64.deb

# その他のOSは公式サイトを参照
# https://tinygo.org/getting-started/install/

# Go 1.22.12のインストール (必須)
go install golang.org/dl/go1.22.12@latest
go1.22.12 download
# これは ~/sdk/go1.22.12 にインストールされます
```

#### 2. リポジトリのクローン

```bash
git clone https://github.com/yourusername/exif-viewer-extension.git
cd exif-viewer-extension
```

#### 3. WASMモジュールのビルド

```bash
./build.sh
```

このスクリプトは以下を実行します:
- Goの依存関係をダウンロード
- TinyGoでWASMモジュールをコンパイル
- wasm_exec.jsランタイムをコピー

#### 4. 拡張機能の読み込み

1. Google Chromeの拡張機能ページを開きます（chrome://extensions/）
2. 右上の「デベロッパーモード」スイッチをオンにします
3. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
4. このプロジェクトのルートディレクトリを選択します

## 使い方

### 方法1: 右クリックメニューから

1. Webページ上の画像を右クリック
2. 「View EXIF」を選択
3. モーダルウィンドウにEXIF情報が表示されます

### 方法2: 拡張機能のポップアップから

1. ツールバーの拡張機能アイコンをクリック
2. 「🔍 画像をスキャン」ボタンをクリック
3. ページ内の画像リストが表示されます
4. 画像をクリックするとEXIF情報が表示されます

### ソートオプション

画像リストは以下の方法でソートできます:
- **面積 (H×W)**: 画像の面積順 (デフォルト)
- **高さ (H)**: 画像の高さ順
- **幅 (W)**: 画像の幅順

## 開発

### プロジェクト構造

```
exif-viewer-extension/
├── manifest.json          # 拡張機能マニフェスト
├── background.js          # バックグラウンドサービスワーカー
├── content.js             # コンテンツスクリプト
├── popup.html             # ポップアップUI
├── popup.js               # ポップアップロジック
├── ui/                    # UIモジュール
│   ├── modal.js           # モーダル表示
│   ├── exif-display.js    # EXIF表示
│   ├── image-list.js      # 画像リスト
│   ├── styles.js          # スタイル定義
│   └── utils.js           # ユーティリティ
├── wasm/                  # WASMモジュール
│   ├── main.go            # Goエントリーポイント
│   ├── parser/            # パーサー実装
│   │   ├── parser.go      # パーサーインターフェース
│   │   ├── exif.go        # EXIF解析 (JPEG/TIFF)
│   │   ├── png.go         # PNG (将来対応)
│   │   ├── webp.go        # WebP (将来対応)
│   │   └── heif.go        # HEIF (将来対応)
│   ├── loader.js          # WASMローダー
│   ├── exif-parser.wasm   # ビルド済みWASM (git管理外)
│   └── wasm_exec.js       # TinyGoランタイム (git管理外)
├── build.sh               # WASMビルドスクリプト
└── packing.sh             # 配布パッケージ作成
```

### ビルドコマンド

```bash
# WASMモジュールのビルド
./build.sh

# 配布用zipファイルの作成
./packing.sh
```

### 技術スタック

- **Frontend**: Vanilla JavaScript (ES6+ Modules)
- **WASM**: Go + TinyGo
- **EXIF解析**: goexif ライブラリ
- **UI**: CSS-in-JS (スタイル定義)

## 対応環境

Manifest V3に対応したバージョン以降のChromiumベースのブラウザであれば実行可能です:
- Google Chrome 88+
- Microsoft Edge 88+
- その他Chromiumベースブラウザ

## 貢献

このプロジェクトに興味を持っていただき、ありがとうございます！プルリクエストやイシューを歓迎します。

### 貢献の手順

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 画像形式の追加方法

新しい画像形式を追加するには:

1. `wasm/parser/` に新しいパーサーファイルを作成 (例: `avif.go`)
2. `Parser` インターフェースを実装
3. `parser.go` の `DetectFormat()` と `GetParser()` を更新
4. WASMを再ビルド

詳細は `wasm/parser/parser.go` のコメントを参照してください。

## ライセンス

このプロジェクトは MPL2.0 のもとでライセンスされています。
詳細は [LICENSE.md](LICENSE.md) を参照してください。

## 作者

この拡張機能は [@akai_kichune](https://twitter.com/akai_kichune) によって作成されました。

## クレジット

- **goexif**: https://github.com/rwcarlsen/goexif
- **TinyGo**: https://tinygo.org/
- スクリーンショット用画像: [exif-samples](https://github.com/ianare/exif-samples)
