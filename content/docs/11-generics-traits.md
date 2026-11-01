---
title: "11. ジェネリクスとトレイト"
weight: 110
quiz:
  - q: "次の関数はコンパイルできる？"
    code: |
      fn largest<T>(list: &[T]) -> &T {
          let mut max = &list[0];
          for item in list {
              if item > max { max = item; }
          }
          max
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "どんな型 `T` でも `>` で比較できるとは限りません。`fn largest<T: PartialOrd>(...)` のように **トレイト境界** で「比較できる型」に制限する必要があります。"
  - q: "トレイトを一言で説明すると？"
    choices:
      - "型が持つべき振る舞い（メソッドの集合）の定義"
      - "構造体のフィールドの集合"
      - "モジュールの別名"
      - "マクロの一種"
    answer: 0
    explain: "トレイトは他言語のインターフェースに近い概念で、「この型はこういうことができる」という約束を定めます。"
  - q: "`fn notify(item: &impl Summary)` と同じ意味になるのは？"
    choices:
      - "`fn notify<T: Summary>(item: &T)`"
      - "`fn notify(item: &Summary)`"
      - "`fn notify<T>(item: &T) where Summary: T`"
      - "`fn notify(item: Box<Summary>)`"
    answer: 0
    explain: "引数位置の `impl Trait` はトレイト境界付きジェネリクスの糖衣構文です。"
  - q: "ジェネリクスを使うと実行速度が遅くなる？"
    choices:
      - "遅くなる（実行時に型を調べるため）"
      - "遅くならない（コンパイル時に具体的な型ごとのコードが生成される）"
    answer: 1
    explain: "Rust は **単相化（monomorphization）** によって、使われた型ごとに専用のコードを生成します。実行時コストはゼロです。"
---

# 11. ジェネリクスとトレイト

## 🎯 この章のゴール

- ジェネリクスで型に依存しないコードを書く
- トレイトで「共通の振る舞い」を定義・実装する
- トレイト境界で型に条件を付ける

## 💡 ひとことで言うと

> ジェネリクスは **型の穴埋め問題**、トレイトは **資格試験**。「この関数は『比較できる』資格を持つ型ならなんでも受け付けます」と書けます。

## ジェネリクス

```rust
#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl Point<f64> {                  // f64 のときだけ使えるメソッド
    fn dist(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

fn main() {
    let a = Point { x: 5, y: 10 };       // Point<i32>
    let b = Point { x: 3.0, y: 4.0 };    // Point<f64>
    println!("{} {} {a:?}", a.x(), b.dist());
}
```

`Option<T>` や `Vec<T>`、`Result<T, E>` もジェネリクスで定義されています。

## トレイト: 共通の振る舞い

```rust
trait Summary {
    fn author(&self) -> String;

    fn summarize(&self) -> String {          // デフォルト実装
        format!("{} さんの投稿を読む…", self.author())
    }
}

struct Tweet {
    user: String,
    text: String,
}

struct Article {
    title: String,
}

impl Summary for Tweet {
    fn author(&self) -> String {
        format!("@{}", self.user)
    }
    fn summarize(&self) -> String {          // 上書きもできる
        format!("{}: {}", self.author(), self.text)
    }
}

impl Summary for Article {
    fn author(&self) -> String {
        String::from("編集部")
    }
}

fn main() {
    let t = Tweet { user: "ferris".into(), text: "Rust 楽しい".into() };
    let a = Article { title: "所有権入門".into() };
    println!("{}", t.summarize());
    println!("{} / {}", a.title, a.summarize());
}
```

## トレイト境界

```rust
use std::fmt::Display;

// 「PartialOrd（比較できる）かつ Copy な型」に限定
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut max = list[0];
    for &item in list {
        if item > max {
            max = item;
        }
    }
    max
}

// impl Trait 記法（短く書ける）
fn show(item: &impl Display) {
    println!("【{item}】");
}

// where 句（境界が長いとき読みやすい）
fn pair_info<T, U>(t: T, u: U) -> String
where
    T: Display + Clone,
    U: std::fmt::Debug,
{
    format!("{t} / {u:?}")
}

fn main() {
    println!("{}", largest(&[3, 7, 2]));
    println!("{}", largest(&['a', 'z', 'm']));
    show(&42);
    println!("{}", pair_info("hi", vec![1, 2]));
}
```

## よく使う標準トレイト

| トレイト | できること | derive 可 |
|---|---|---|
| `Debug` | `{:?}` で表示 | ✅ |
| `Display` | `{}` で表示 | ❌ 手書き |
| `Clone` / `Copy` | 複製 / 暗黙コピー | ✅ |
| `PartialEq` / `Eq` | `==` で比較 | ✅ |
| `PartialOrd` / `Ord` | `<` `>` で比較、ソート | ✅ |
| `Hash` | HashMap のキーにする | ✅ |
| `Default` | `T::default()` で既定値 | ✅ |
| `From` / `Into` | 型変換 | ❌ |

> [!NOTE]
> **孤児ルール**: トレイトか型のどちらかが自分のクレートのものでないと `impl` できません。`impl Display for Vec<T>` のように他人同士の組み合わせは不可です。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

`Animal` トレイトを `Dog` と `Cat` に実装して、「ポチ: ワン！」のように表示しよう。

```rust {class="exercise"}
trait Animal {
    fn name(&self) -> String;
    fn speak(&self) -> String;
}

struct Dog;
struct Cat;

// TODO: impl Animal for Dog { ... }
// TODO: impl Animal for Cat { ... }

fn intro(a: &impl Animal) {
    println!("{}: {}", a.name(), a.speak());
}

fn main() {
    // TODO: コメントを外そう
    // intro(&Dog);
    // intro(&Cat);
}
```

## 📝 まとめ

- ジェネリクスで型をパラメータ化。単相化でコストゼロ
- トレイトで振る舞いを定義し、`impl Trait for Type` で実装
- `T: Trait` / `impl Trait` / `where` で型に条件を付ける

## ✅ 理解度クイズ

{{< quiz >}}
