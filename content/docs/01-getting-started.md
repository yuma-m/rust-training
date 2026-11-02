---
title: "01. はじめの一歩"
weight: 10
quiz:
  - q: "新しいプロジェクト `hello` を作るコマンドはどれ？"
    choices:
      - "`rustc new hello`"
      - "`cargo new hello`"
      - "`cargo init --name hello --run`"
      - "`rustup new hello`"
    answer: 1
    explain: "`cargo new <名前>` で `Cargo.toml` と `src/main.rs` を含むプロジェクトが作られます。`rustup` はツールチェーン（Rust 本体）の管理ツールです。"
  - q: "`println!` の末尾の `!` は何を意味する？"
    choices:
      - "強調表示して出力する"
      - "エラーが起きたら panic する"
      - "関数ではなくマクロを呼び出している"
      - "改行を出力する"
    answer: 2
    explain: "`!` が付いているのは **マクロ** の呼び出しです。マクロはコンパイル時にコードを展開する仕組みで、可変個の引数を受け取れます。"
  - q: "コンパイルせずに「型エラーなどがないか」だけを素早く確認したい。使うコマンドは？"
    choices:
      - "`cargo check`"
      - "`cargo run --dry`"
      - "`cargo test`"
      - "`cargo fmt`"
    answer: 0
    explain: "`cargo check` は実行ファイルを生成せずに検査だけ行うので `cargo build` より速く、書きながら何度も回すのに向いています。"
  - q: "依存クレート（ライブラリ）を書くファイルはどれ？"
    choices:
      - "`src/main.rs`"
      - "`Cargo.lock`"
      - "`Cargo.toml`"
      - "`rust-toolchain`"
    answer: 2
    explain: "依存は `Cargo.toml` の `[dependencies]` に書きます。`Cargo.lock` は実際に解決されたバージョンを記録するファイルで、手で編集しません。"
---

# 01. はじめの一歩: cargo と Hello, world!

## 🎯 この章のゴール

- Rust をインストールして `Hello, world!` を動かす
- Rust のビルドツール **Cargo** の基本コマンドを覚える

## 💡 ひとことで言うと

> **Cargo は Rust の「なんでも係」**。プロジェクト作成・ビルド・実行・テスト・ライブラリ管理を全部ひとりでこなします。

## インストール

公式のインストーラ **rustup** を使います（macOS / Linux）。

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version   # rustc 1.xx.x と出れば OK
```

Windows は [rustup.rs](https://rustup.rs/) からインストーラをダウンロードします。
アップデートは `rustup update` の一発です。

## Hello, world!

```sh
cargo new hello
cd hello
cargo run
```

これだけで `Hello, world!` が表示されます 🎉 生成されたファイルを見てみましょう。

```text
hello/
├── Cargo.toml   # プロジェクトの設定と依存ライブラリ
└── src/
    └── main.rs  # ここにコードを書く
```

```rust
fn main() {
    println!("Hello, world!");
}
```

- `fn main()`: プログラムの入口となる関数
- `println!`: 文字列を出力して改行する **マクロ**（`!` が目印）
- 文の終わりには `;`

## Cargo の基本コマンド

| コマンド | やること |
|---|---|
| `cargo new <名前>` | 新しいプロジェクトを作る |
| `cargo build` | ビルドする（`target/debug/` に出力） |
| `cargo run` | ビルドして実行する |
| `cargo check` | ビルドせずにエラーだけ確認（速い！） |
| `cargo build --release` | 最適化してビルド（本番用） |
| `cargo test` | テストを実行する |
| `cargo fmt` / `cargo clippy` | 整形 / リント |

> [!TIP]
> 書いている途中は `cargo check` をこまめに回すのがおすすめ。Rust のコンパイラはエラーメッセージがとても親切で、直し方まで教えてくれます。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。

自分の名前と好きな食べ物を 2 行で表示してみましょう。`{}` で値を埋め込めます。

```rust {class="exercise"}
fn main() {
    // TODO: 自分の名前と好きな食べ物に書き換えて、2 行目も追加しよう
    println!("{}は{}が好き", "ferris", "カニカマ");
}
```

## 📝 まとめ

- Rust のインストールは `rustup`、プロジェクト管理は `cargo`
- `cargo new` → `cargo run` で即実行、`cargo check` で素早く検査
- `!` 付きの呼び出しはマクロ

## ✅ 理解度クイズ

{{< quiz >}}
