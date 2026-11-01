---
title: "06. 構造体とメソッド"
weight: 60
quiz:
  - q: "メソッドの第 1 引数 `&self` は何の省略形？"
    choices:
      - "`self: Self`"
      - "`self: &Self`"
      - "`self: &mut Self`"
      - "`this: Self`"
    answer: 1
    explain: "`&self` は `self: &Self` の省略です。インスタンスを **借りて読むだけ** のメソッドになります。書き換えるなら `&mut self`、所有権を奪うなら `self`。"
  - q: "`String::from(\"x\")` や `Rect::square(3)` のように `::` で呼ぶ、`self` を取らない関数を何と呼ぶ？"
    choices:
      - "メソッド"
      - "関連関数"
      - "クロージャ"
      - "マクロ"
    answer: 1
    explain: "`impl` ブロック内で `self` を取らない関数は **関連関数** です。コンストラクタ（`new` など）によく使われます。"
  - q: "次のコードの出力は？"
    code: |
      #[derive(Debug)]
      struct P { x: i32, y: i32 }

      fn main() {
          let a = P { x: 1, y: 2 };
          let b = P { x: 10, ..a };
          println!("{:?}", b);
      }
    choices:
      - "`P { x: 1, y: 2 }`"
      - "`P { x: 10, y: 2 }`"
      - "`P { x: 10, y: 0 }`"
      - "コンパイルエラー"
    answer: 1
    explain: "`..a` は **構造体更新記法** で、指定しなかったフィールドを `a` から持ってきます。"
  - q: "`println!(\"{:?}\", rect)` で構造体を表示するために必要なものは？"
    choices:
      - "`impl Display for Rect` を必ず手書きする"
      - "構造体に `#[derive(Debug)]` を付ける"
      - "`use std::fmt;` だけ書く"
      - "何もいらない"
    answer: 1
    explain: "`{:?}` は `Debug` トレイトを使います。`#[derive(Debug)]` で自動実装できます。`{}` で表示するには `Display` の手動実装が必要です。"
---

# 06. 構造体とメソッド

## 🎯 この章のゴール

- 構造体（struct）でデータをまとめる
- `impl` でメソッドと関連関数を定義する
- `#[derive(Debug)]` でデバッグ表示する

## 💡 ひとことで言うと

> 構造体は **名前付きの入れ物**。`impl` でその入れ物に **できること（メソッド）** を生やします。

## 定義と生成

```rust
#[derive(Debug)]
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let name = String::from("Ferris");
    let mut user = User {
        name,           // 変数名とフィールド名が同じなら省略できる
        age: 8,
        active: true,
    };
    user.age += 1;      // インスタンス全体が mut なら変更できる

    let other = User {
        name: String::from("Corro"),
        ..user          // 残りは user からコピー（構造体更新記法）
    };
    println!("{user:?}");
    println!("{other:#?}"); // {:#?} は整形して表示
}
```

## タプル構造体・ユニット様構造体

```rust
struct Color(u8, u8, u8);   // フィールド名なし
struct Meters(f64);         // 型に意味を持たせる（newtype）
struct Marker;              // フィールドなし

fn main() {
    let red = Color(255, 0, 0);
    let d = Meters(42.0);
    let _m = Marker;
    println!("{} {}", red.0, d.0);
}
```

`Meters(f64)` と `Seconds(f64)` を別の型にすれば、うっかり足し算するミスをコンパイラが防いでくれます。

## メソッドと関連関数

```rust
#[derive(Debug)]
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    // 関連関数（self なし）: Rect::square(3) で呼ぶ
    fn square(size: u32) -> Self {
        Self { w: size, h: size }
    }

    // メソッド: rect.area() で呼ぶ
    fn area(&self) -> u32 {
        self.w * self.h
    }

    fn scale(&mut self, k: u32) {
        self.w *= k;
        self.h *= k;
    }

    fn can_hold(&self, other: &Rect) -> bool {
        self.w > other.w && self.h > other.h
    }
}

fn main() {
    let mut big = Rect { w: 30, h: 50 };
    let small = Rect::square(10);
    big.scale(2);
    println!("面積 {}、入る？ {}", big.area(), big.can_hold(&small));
}
```

| 第 1 引数 | 意味 | 使いどころ |
|---|---|---|
| `&self` | 借りて読む | ほとんどのメソッド |
| `&mut self` | 借りて書き換える | 状態を変更する |
| `self` | 所有権を奪う | 別の値に変換して元を使えなくする |

> [!TIP]
> `big.area()` と書くと Rust が自動的に `(&big).area()` にしてくれます（自動参照）。C++ の `->` のような使い分けは不要です。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

`Rect` に「正方形かどうか」を返すメソッドを追加しよう。

```rust {class="exercise"}
struct Rect {
    w: u32,
    h: u32,
}

impl Rect {
    fn is_square(&self) -> bool {
        todo!()
    }
}

fn main() {
    println!("{}", Rect { w: 3, h: 3 }.is_square()); // true
    println!("{}", Rect { w: 3, h: 5 }.is_square()); // false
}
```

## 📝 まとめ

- `struct` でデータをまとめ、`impl` で振る舞いを追加
- `&self` / `&mut self` / `self` で借用の仕方を選ぶ
- `#[derive(Debug)]` + `{:?}` でお手軽デバッグ表示

## ✅ 理解度クイズ

{{< quiz >}}
