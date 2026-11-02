---
title: "08. パッケージ・クレート・モジュール"
weight: 80
quiz:
  - q: "モジュール内の関数は、何も付けないとどうなる？"
    choices:
      - "どこからでも呼べる（公開）"
      - "そのモジュールと子モジュールからだけ呼べる（非公開）"
      - "同じファイル内からだけ呼べる"
      - "コンパイルエラーになる"
    answer: 1
    explain: "Rust のアイテムは **デフォルトで非公開** です。外から使わせたいものに `pub` を付けます。"
  - q: "次の構造体を別モジュールから `Point { x: 1, y: 2 }` で生成できる？"
    code: |
      mod geo {
          pub struct Point {
              pub x: i32,
              y: i32,
          }
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "構造体を `pub` にしても **フィールドは個別に非公開** のままです。`y` が非公開なので外から直接生成できません。`pub fn new(...)` を用意するのが定番です。（enum は `pub` にすると全バリアントが公開されます）"
  - q: "`mod network;` と書いたとき、コンパイラが探すファイルは？（`src/main.rs` から）"
    choices:
      - "`src/network.rs` または `src/network/mod.rs`"
      - "`network.toml`"
      - "`src/lib/network.rs`"
      - "`crates/network/main.rs`"
    answer: 0
    explain: "`mod 名前;` はモジュールの中身を `src/名前.rs`（または古い形式の `src/名前/mod.rs`）から読み込みます。"
  - q: "パス `crate::`, `self::`, `super::` のうち、親モジュールを指すのは？"
    choices:
      - "`crate::`"
      - "`self::`"
      - "`super::`"
    answer: 2
    explain: "`crate::` はクレートのルート、`self::` は現在のモジュール、`super::` は親モジュールです。"
---

# 08. パッケージ・クレート・モジュール

## 🎯 この章のゴール

- パッケージ・クレート・モジュールの関係を掴む
- `pub` と `use` で公開範囲とパスを管理する
- モジュールを複数ファイルに分ける

## 💡 ひとことで言うと

> **パッケージ = 段ボール箱**、**クレート = 箱の中の製品**、**モジュール = 製品の中の部屋**。部屋のドアはデフォルトで閉まっていて、`pub` で開けます。

## 用語の整理

| 用語 | 説明 |
|---|---|
| パッケージ | `Cargo.toml` を持つ単位。1 つ以上のクレートを含む |
| クレート | コンパイルの単位。**バイナリ**（`src/main.rs`）か **ライブラリ**（`src/lib.rs`） |
| モジュール | クレート内でコードを整理し、公開範囲を決める仕組み |
| パス | アイテムの場所。`crate::front::seat` のように `::` で区切る |

## モジュールと pub

```rust
mod restaurant {
    pub mod front {
        pub fn seat() {
            println!("お席へどうぞ");
            super::kitchen::cook(); // 親モジュール経由で兄弟へ
        }
    }

    mod kitchen {
        pub fn cook() {
            println!("調理中…");
        }
    }

    pub struct Order {
        pub dish: String,   // 公開フィールド
        secret_note: String, // 非公開フィールド
    }

    impl Order {
        pub fn new(dish: &str) -> Self {
            Self { dish: dish.to_string(), secret_note: String::from("大盛り") }
        }
        pub fn note(&self) -> &str {
            &self.secret_note
        }
    }
}

use restaurant::front; // パスを短く

fn main() {
    front::seat();
    let order = restaurant::Order::new("ラーメン");
    println!("{} ({})", order.dish, order.note());
    // restaurant::kitchen::cook(); // ← kitchen は非公開なのでエラー
}
```

- 子は親の非公開アイテムを使えるが、親は子の非公開アイテムを使えない
- 構造体は **フィールドごと** に `pub` が必要。enum は `pub enum` で全バリアント公開

## use のお作法

```rust
use std::collections::HashMap;           // 型・構造体はフルネームまで
use std::fmt::Result;
use std::io::Result as IoResult;         // 名前の衝突は as で回避
use std::io::{self, Write};              // まとめて取り込み

fn main() {
    let mut m: HashMap<&str, i32> = HashMap::new();
    m.insert("a", 1);
    let _r: Result = Ok(());
    let _io: IoResult<()> = io::stdout().flush();
}
```

> [!TIP]
> 慣習として、**関数は親モジュールまで** `use` して `front::seat()` と呼び、**構造体や enum はフルパス** で `use` して `HashMap::new()` と呼びます。どこから来た関数か分かりやすくなります。

## ファイルに分ける

```text
src/
├── main.rs        // mod restaurant;
├── restaurant.rs  // pub mod front; mod kitchen;
└── restaurant/
    ├── front.rs   // pub fn seat() { ... }
    └── kitchen.rs // pub fn cook() { ... }
```

`mod 名前;`（波括弧なし）と書くと、同名のファイルから中身が読み込まれます。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。

ファイルを分ける代わりに、`mod` ブロックで練習します。`shapes::circle` モジュールに円の面積を返す `area` を公開しよう。

```rust {class="exercise"}
mod shapes {
    pub mod circle {
        // TODO: pub fn area(r: f64) -> f64 を定義しよう
    }
}

fn main() {
    // TODO: コメントを外して呼び出そう
    // println!("{}", shapes::circle::area(2.0));
}
```

手元で試すなら `cargo new --lib shapes` でライブラリを作り、`src/lib.rs` に書いてみましょう。

## 📝 まとめ

- パッケージ ⊃ クレート ⊃ モジュール
- すべてデフォルト非公開。`pub` で公開（構造体はフィールドごと）
- `use` でパスを短く、`mod 名前;` でファイル分割

## ✅ 理解度クイズ

{{< quiz >}}
