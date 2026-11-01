---
title: "18. 発展トピック"
weight: 180
quiz:
  - q: "異なる型（`Circle`, `Square`）を 1 つの `Vec` に入れて、共通のメソッドを呼びたい。適切な型は？"
    choices:
      - "`Vec<impl Shape>`"
      - "`Vec<Box<dyn Shape>>`"
      - "`Vec<Shape>`"
      - "`Vec<T: Shape>`"
    answer: 1
    explain: "`dyn Shape` は **トレイトオブジェクト** で、実行時にどのメソッドを呼ぶか決まります（動的ディスパッチ）。サイズが不定なので `Box` などのポインタ越しに使います。"
  - q: "`unsafe` ブロックについて正しいものは？"
    choices:
      - "借用チェックが完全に無効になる"
      - "生ポインタの参照外しなど、一部の追加操作が許可される。安全性の保証は書いた人の責任"
      - "コードが自動的に高速化される"
      - "使うとコンパイルエラーになる"
    answer: 1
    explain: "`unsafe` でも借用チェックや型チェックは働きます。許可されるのは生ポインタの参照外し、unsafe 関数の呼び出しなど限られた操作だけです。"
  - q: "`macro_rules!` で定義する宣言的マクロの特徴は？"
    choices:
      - "実行時に呼ばれる関数"
      - "パターンにマッチした入力をコンパイル時にコードへ展開する"
      - "型を定義するための構文"
      - "非同期処理専用"
    answer: 1
    explain: "`vec!` や `println!` のように、可変個の引数を取ったり、繰り返しを含むコードを生成したりできます。"
  - q: "`type Km = i32;` のような型エイリアスと、`struct Km(i32);`（newtype）の違いは？"
    choices:
      - "違いはない"
      - "エイリアスは単なる別名で `i32` と混ぜて使えるが、newtype は別の型として区別される"
      - "エイリアスの方が型安全"
      - "newtype は実行時コストが大きい"
    answer: 1
    explain: "型エイリアスは長い型名を短くするための別名です。単位の取り違えなどを防ぎたいなら newtype パターンを使います（実行時コストはゼロ）。"
---

# 18. 発展トピック

## 🎯 この章のゴール

- トレイトオブジェクトで動的ディスパッチを使う
- `unsafe`・マクロ・高度な型の存在を知る
- 次に何を学ぶかの地図を手に入れる

## 💡 ひとことで言うと

> ここまでで Rust の土台は完成です 🎉 この章は「こんな道具もあるよ」という **道具箱のカタログ**。必要になったときに思い出せれば十分です。

## トレイトオブジェクト（dyn Trait）

```rust
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> String {
        String::from("図形")
    }
}

struct Circle(f64);
struct Square(f64);

impl Shape for Circle {
    fn area(&self) -> f64 { 3.14 * self.0 * self.0 }
    fn name(&self) -> String { String::from("円") }
}

impl Shape for Square {
    fn area(&self) -> f64 { self.0 * self.0 }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle(1.0)), Box::new(Square(2.0))];
    for s in &shapes {
        println!("{}: {:.2}", s.name(), s.area());
    }
}
```

| | ジェネリクス（`impl Trait` / `T: Trait`） | トレイトオブジェクト（`dyn Trait`） |
|---|---|---|
| 決定タイミング | コンパイル時（静的ディスパッチ） | 実行時（動的ディスパッチ） |
| 速度 | 最速（インライン化可能） | わずかにオーバーヘッド |
| 異なる型を混ぜる | ❌ | ✅ |

## パターンいろいろ

```rust
struct Point3 {
    x: i32,
    y: i32,
    z: i32,
}

fn main() {
    let p = Point3 { x: 1, y: -2, z: 3 };
    let Point3 { x, .. } = p;                 // 一部だけ分解
    match p.y {
        n @ -5..=-1 => println!("小さな負の数 {n}"), // @ で束縛しつつ範囲チェック
        _ => println!("その他"),
    }
    let nums = [1, 2, 3, 4, 5];
    if let [first, .., last] = nums {          // スライスパターン
        println!("{x} {first} {last} {}", p.z);
    }
}
```

## unsafe Rust

コンパイラが安全性を証明できない操作を「自分が責任を持つ」と宣言して行います。

```rust
fn main() {
    let mut num = 5;
    let r = &raw mut num;  // 生ポインタの作成は安全
    unsafe {
        *r += 1;           // 参照外しは unsafe
    }
    println!("{num}");
}
```

許可される操作: 生ポインタの参照外し / `unsafe fn` の呼び出し / 可変 static へのアクセス / `unsafe trait` の実装 / union のフィールドアクセス。
実際には **安全な API の内側に unsafe を閉じ込める** のが Rust 流です（`Vec` の内部実装など）。

## マクロ

```rust
macro_rules! hashmap {
    ($($k:expr => $v:expr),* $(,)?) => {{
        let mut m = std::collections::HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}

fn main() {
    let ages = hashmap! { "ferris" => 8, "corro" => 3 };
    println!("{:?}", ages.get("ferris"));
}
```

- **宣言的マクロ** `macro_rules!`: パターンマッチでコードを生成
- **手続き的マクロ**: `#[derive(...)]`、属性マクロ（`#[tokio::main]`）、関数風マクロ。別クレートで定義

## 高度な型・トレイト（さわりだけ）

```rust
use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Meters(f64);

impl Add for Meters {          // 演算子オーバーロード
    type Output = Meters;      // 関連型
    fn add(self, other: Meters) -> Meters {
        Meters(self.0 + other.0)
    }
}

type Callback = Box<dyn Fn(i32) -> i32>; // 型エイリアス

fn never_returns() -> ! {      // never 型: 決して戻らない
    panic!("ここで終わり");
}

fn main() {
    let total = Meters(1.5) + Meters(2.0);
    let double: Callback = Box::new(|x| x * 2);
    println!("{total:?} {}", double(21));
    if total.0 < 0.0 {
        never_returns();
    }
}
```

## 次のステップ 🗺️

| やりたいこと | おすすめ |
|---|---|
| もっと深く | [The Book 日本語版](https://doc.rust-jp.rs/book-ja/) の 19〜21 章（最終プロジェクト: マルチスレッド Web サーバー） |
| 例で学ぶ | [Rust by Example](https://doc.rust-jp.rs/rust-by-example-ja/) |
| 手を動かす | [Rustlings](https://github.com/rust-lang/rustlings)（小さな演習問題集） |
| CLI ツール | `clap`, `anyhow`, `serde` |
| Web | `axum`, `tokio`, `sqlx` |
| unsafe の深淵 | [The Rustonomicon](https://doc.rust-lang.org/nomicon/) |

## 📝 まとめ

- 異なる型をまとめて扱うなら `Box<dyn Trait>`
- `unsafe` は限定された操作だけを許可し、安全な API で包んで使う
- マクロでコード生成、トレイトで演算子オーバーロード

## ✅ 理解度クイズ

{{< quiz >}}

---

**🎉 完走おめでとうございます！** [トップページ]({{< relref "/_index.md" >}}) で全章のクイズ結果を確認してみましょう。
