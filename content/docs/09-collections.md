---
title: "09. よく使うコレクション"
weight: 90
quiz:
  - q: "次のコードはコンパイルできる？"
    code: |
      fn main() {
          let mut v = vec![1, 2, 3];
          let first = &v[0];
          v.push(4);
          println!("{first}");
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "`push` でベクタが再確保されると、`first` が指していたメモリは無効になるかもしれません。不変参照 `first` が生きている間に可変借用（`push`）はできません。"
  - q: "`v.get(10)` と `v[10]`（要素数 3 のベクタ）の違いは？"
    choices:
      - "どちらも `None` を返す"
      - "`get` は `None` を返し、`[]` は panic する"
      - "`get` は panic し、`[]` は `None` を返す"
      - "どちらもコンパイルエラー"
    answer: 1
    explain: "範囲外の可能性があるなら `get` で `Option` を受け取り安全に処理します。"
  - q: "`let s = String::from(\"こんにちは\"); s.len()` の値は？"
    choices:
      - "5"
      - "10"
      - "15"
      - "20"
    answer: 2
    explain: "`len()` は **バイト数** です。ひらがなは UTF-8 で 1 文字 3 バイトなので 15。文字数は `s.chars().count()` で数えます。"
  - q: "HashMap で「キーが無ければ 0 を入れ、その値に 1 を足す」書き方は？"
    choices:
      - "`*map.entry(k).or_insert(0) += 1;`"
      - "`map[k] += 1;`"
      - "`map.insert(k, +1);`"
      - "`map.get(k).unwrap() += 1;`"
    answer: 0
    explain: "`entry(k).or_insert(0)` は値への可変参照 `&mut V` を返すので、`*` で参照外しして加算します。単語カウントの定番イディオムです。"
---

# 09. よく使うコレクション

## 🎯 この章のゴール

- `Vec<T>`・`String`・`HashMap<K, V>` を使いこなす
- 文字列が UTF-8 であることの意味を知る

## 💡 ひとことで言うと

> `Vec` は **伸び縮みする配列**、`String` は **伸び縮みする UTF-8 文字列**、`HashMap` は **キーで引ける辞書**。3 つともヒープにデータを置く所有型です。

## Vec\<T\>: 可変長配列

```rust
fn main() {
    let mut v: Vec<i32> = Vec::new();
    v.push(1);
    v.push(2);
    let w = vec![10, 20, 30];       // マクロで初期化

    let third = &w[2];              // 範囲外なら panic
    match w.get(5) {                // 範囲外なら None
        Some(x) => println!("{x}"),
        None => println!("5 番目はない"),
    }

    for x in &mut v {
        *x *= 100;                  // 可変参照で書き換え
    }
    println!("{v:?} {third}");
    println!("{:?}", v.pop());      // Some(200)
}
```

違う型を混ぜたいときは、enum に包めば 1 つの `Vec` に入れられます。

```rust
#[derive(Debug)]
enum Cell {
    Int(i64),
    Text(String),
}

fn main() {
    let row = vec![Cell::Int(3), Cell::Text(String::from("blue"))];
    println!("{row:?}");
}
```

## String: UTF-8 文字列

```rust
fn main() {
    let mut s = String::from("foo");
    s.push_str("bar");          // 文字列を追加
    s.push('!');                // 1 文字追加

    let a = String::from("Hello, ");
    let b = String::from("world");
    let c = a + &b;             // a はムーブされる。b は借用
    let d = format!("{c} / {b}"); // format! は何もムーブしない

    let jp = "こんにちは";
    println!("{s} {d} bytes={} chars={}", jp.len(), jp.chars().count());
    for ch in jp.chars().take(2) {
        print!("{ch} ");        // こ ん
    }
    println!();
}
```

> [!WARNING]
> `s[0]` のような **インデックスアクセスはできません**。UTF-8 では 1 文字が 1〜4 バイトなので「0 番目」が文字なのかバイトなのか曖昧だからです。文字単位なら `.chars()`、バイト単位なら `.bytes()` を使います。

## HashMap\<K, V\>: 辞書

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Blue"), 25);         // 上書き
    scores.entry(String::from("Red")).or_insert(50); // 無ければ挿入

    if let Some(s) = scores.get("Blue") {
        println!("Blue = {s}");
    }

    // 単語カウント
    let text = "a b a c b a";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("{counts:?}"); // 順序は不定
}
```

`insert` に `String` を渡すと所有権は HashMap にムーブします。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

整数のリストから **平均値・中央値・最頻値** を求めよう。

```rust {class="exercise"}
use std::collections::HashMap;

fn mean(v: &[i32]) -> f64 {
    todo!("ヒント: iter().sum::<i32>() as f64")
}

fn median(v: &[i32]) -> f64 {
    todo!("ヒント: to_vec() してから sort()")
}

fn mode(v: &[i32]) -> i32 {
    todo!("ヒント: HashMap で出現回数を数える")
}

fn main() {
    let v = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
    println!("平均 {} / 中央値 {} / 最頻値 {}", mean(&v), median(&v), mode(&v));
}
```

## 📝 まとめ

- `Vec` は `push`/`pop`/`get`。参照を持ったまま `push` はできない
- `String` は UTF-8。`len()` はバイト数、文字は `chars()`
- `HashMap` は `entry().or_insert()` が便利

## ✅ 理解度クイズ

{{< quiz >}}
