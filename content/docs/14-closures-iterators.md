---
title: "14. クロージャとイテレータ"
weight: 140
quiz:
  - q: "次のコードの出力は？"
    code: |
      fn main() {
          let v = vec![1, 2, 3, 4, 5, 6];
          let s: i32 = v.iter().filter(|&&x| x % 2 == 0).map(|x| x * 10).sum();
          println!("{s}");
      }
    choices:
      - "`21`"
      - "`120`"
      - "`210`"
      - "`12`"
    answer: 1
    explain: "偶数 2, 4, 6 を取り出し、10 倍して 20 + 40 + 60 = 120 です。"
  - q: "次のコードは何も出力しない。なぜ？"
    code: |
      fn main() {
          let v = vec![1, 2, 3];
          v.iter().map(|x| println!("{x}"));
      }
    choices:
      - "`map` の中では `println!` が使えないから"
      - "イテレータは **怠惰** で、消費するメソッドを呼ぶまで何も実行されないから"
      - "`v` が不変だから"
      - "`iter()` が空のイテレータを返すから"
    answer: 1
    explain: "`map` などのアダプタは新しいイテレータを作るだけです。`collect` / `sum` / `for` などで消費して初めて動きます（コンパイラも警告してくれます）。副作用だけが目的なら `for` ループか `for_each` を使います。"
  - q: "スレッドに渡すクロージャで、捕捉した変数の所有権を **強制的に** 移すキーワードは？"
    choices:
      - "`own`"
      - "`move`"
      - "`take`"
      - "`static`"
    answer: 1
    explain: "`move |..| ..` と書くと、クロージャは使う変数の所有権を奪います。スレッド（16 章）などクロージャが元のスコープより長生きする場合に必要です。"
  - q: "`v.iter()`、`v.iter_mut()`、`v.into_iter()` が返す要素の型はそれぞれ？（`v: Vec<T>`）"
    choices:
      - "`&T` / `&mut T` / `T`"
      - "`T` / `&T` / `&mut T`"
      - "すべて `&T`"
      - "`&mut T` / `&T` / `T`"
    answer: 0
    explain: "`iter` は借用、`iter_mut` は可変借用、`into_iter` は所有権ごと取り出します（`v` はムーブされます）。"
---

# 14. クロージャとイテレータ

## 🎯 この章のゴール

- クロージャ（無名関数）を書き、環境の捕捉を理解する
- イテレータのアダプタをつなげてデータを処理する

## 💡 ひとことで言うと

> クロージャは **周りの変数を持ち歩ける小さな関数**。イテレータは **データのベルトコンベア** で、`filter` や `map` という加工機を並べて最後に `collect` で箱詰めします。

## クロージャ

```rust
fn main() {
    let add_one = |x: i32| x + 1;          // 型注釈は省略可
    let square = |x| x * x;                 // 推論される
    println!("{} {}", add_one(1), square(4));

    let tax = 1.1;
    let with_tax = |price: f64| price * tax; // 環境の tax を捕捉！
    println!("{}", with_tax(100.0));

    let mut count = 0;
    let mut inc = || count += 1;            // 可変で捕捉
    inc();
    inc();
    println!("count = {count}");
}
```

### 捕捉の方法と Fn トレイト

クロージャは中身に応じて、自動的に最小限の方法で変数を捕捉します。

| 捕捉方法 | 実装するトレイト | 呼べる回数 |
|---|---|---|
| 不変借用 | `Fn` | 何度でも |
| 可変借用 | `FnMut` | 何度でも（ただし排他的） |
| 所有権を奪う | `FnOnce` | 1 回だけかも |

```rust
fn apply<F: Fn(i32) -> i32>(f: F, v: i32) -> i32 {
    f(v)
}

fn main() {
    let offset = 10;
    println!("{}", apply(|x| x + offset, 5)); // 15

    let name = String::from("Ferris");
    let greet = move || println!("やあ {name}"); // name の所有権を移動
    greet();
    // println!("{name}"); // ← ムーブ済みなので使えない
}
```

## イテレータ

```rust
fn main() {
    let words = vec!["apple", "banana", "cherry", "date"];

    let long: Vec<String> = words
        .iter()                          // イテレータを作る
        .filter(|w| w.len() > 5)         // 条件で絞る
        .map(|w| w.to_uppercase())       // 変換する
        .collect();                      // Vec に集める
    println!("{long:?}");                // ["BANANA", "CHERRY"]

    for (i, w) in words.iter().enumerate().skip(1).take(2) {
        println!("{i}: {w}");
    }

    let total: u32 = (1..=10).sum();
    let has_c = words.iter().any(|w| w.starts_with('c'));
    let pos = words.iter().position(|&w| w == "date");
    println!("{total} {has_c} {pos:?}");
}
```

### よく使うメソッド

| 種類 | メソッド |
|---|---|
| **アダプタ**（新しいイテレータを返す・怠惰） | `map` `filter` `enumerate` `zip` `skip` `take` `rev` `chain` `flat_map` |
| **消費**（結果を返す） | `collect` `sum` `count` `min` `max` `fold` `any` `all` `find` `position` `for_each` |

> [!NOTE]
> イテレータは **怠惰（lazy）** です。`collect` などの消費メソッドを呼ぶまで処理は始まりません。しかもコンパイラが最適化するので、手書きの `for` ループと同等の速さになります（ゼロコスト抽象化）。

## 自作イテレータ

`Iterator` トレイトの `next` を実装するだけで、全メソッドが使えるようになります。

```rust
struct Countdown(u32);

impl Iterator for Countdown {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.0 == 0 {
            None
        } else {
            self.0 -= 1;
            Some(self.0 + 1)
        }
    }
}

fn main() {
    let v: Vec<u32> = Countdown(3).collect();
    println!("{v:?} 発射！🚀"); // [3, 2, 1]
}
```

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

1〜100 のうち「3 の倍数かつ 5 の倍数でない数」の二乗の合計を、イテレータのチェーン 1 本で求めよう。

```rust {class="exercise"}
fn main() {
    let total: u32 = (1..=100)
        // TODO: filter と map をつなげよう
        .sum();
    println!("{total}"); // 正解は 92286
}
```

## 📝 まとめ

- クロージャは `|引数| 式`。環境を `Fn` / `FnMut` / `FnOnce` の形で捕捉
- `move` で所有権を強制的に移動
- イテレータは怠惰。アダプタをつないで消費メソッドで実行

## ✅ 理解度クイズ

{{< quiz >}}
