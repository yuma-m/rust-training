---
title: "05. 参照・借用・スライス"
weight: 50
quiz:
  - q: "次のコードはコンパイルできる？"
    code: |
      fn main() {
          let mut s = String::from("hi");
          let r1 = &mut s;
          let r2 = &mut s;
          println!("{r1} {r2}");
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "可変参照は同時に **1 つだけ** です。`r1` がまだ使われる（`println!` で）うちに `r2` を作ることはできません。"
  - q: "次のコードはコンパイルできる？"
    code: |
      fn main() {
          let mut s = String::from("hi");
          let r1 = &s;
          println!("{r1}");
          let r2 = &mut s;
          r2.push('!');
      }
    choices:
      - "できる"
      - "できない"
    answer: 0
    explain: "`r1` の最後の使用は `println!` です。参照の有効範囲は **最後に使われた地点まで** なので、その後で可変参照 `r2` を作っても衝突しません（NLL: Non-Lexical Lifetimes）。"
  - q: "文字列 `s` の先頭 3 バイトを指す文字列スライスの書き方は？"
    choices:
      - "`s[3]`"
      - "`&s[..3]`"
      - "`s.slice(3)`"
      - "`&s[3..]`"
    answer: 1
    explain: "`&s[0..3]` または省略形 `&s[..3]` です。`&s[3..]` は 3 バイト目から最後まで。"
  - q: "引数に `&String` ではなく `&str` を使うと良い理由は？"
    choices:
      - "`&str` の方が書き換えができるから"
      - "`&String` からも文字列リテラルからも受け取れて汎用的だから"
      - "`&str` は所有権を奪うから"
      - "特に理由はない"
    answer: 1
    explain: "`&String` は自動的に `&str` に変換（参照外し型強制）されるので、`&str` を受け取る関数は `String` にもリテラル `\"abc\"` にも使えます。"
---

# 05. 参照・借用・スライス

## 🎯 この章のゴール

- 所有権を渡さずに値を **借りる** 方法（参照）を学ぶ
- 借用の 2 大ルールを覚える
- スライスで「一部分」を参照する

## 💡 ひとことで言うと

> 参照は **本の貸し出し**。読むだけなら何人に貸してもいいけど、書き込みたい人がいるときはその人 1 人だけに貸します。

## 参照: 所有権を渡さずに使う

```rust
fn len(s: &String) -> usize { // & で「借りる」
    s.len()
} // s は借りているだけなので、ここで drop されない

fn main() {
    let name = String::from("Ferris");
    let n = len(&name);         // 貸し出す
    println!("{name} は {n} 文字"); // まだ使える！
}
```

## 可変参照

借りた値を書き換えるには `&mut` を使います。

```rust
fn shout(s: &mut String) {
    s.push_str("!!!");
}

fn main() {
    let mut msg = String::from("hello");
    shout(&mut msg);
    println!("{msg}"); // hello!!!
}
```

## 借用の 2 大ルール

1. ある時点で、**不変参照（`&`）をいくつでも** か **可変参照（`&mut`）を 1 つだけ** のどちらか
2. 参照は常に **有効なデータ** を指していなければならない

```rust {class="compile-fail"}
fn main() {
    let mut s = String::from("hi");
    let r1 = &s;
    let r2 = &mut s; // error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
    println!("{r1} {r2}");
}
```

このルールのおかげで **データ競合**（同時に読み書きして壊れる問題）がコンパイル時に防がれます。

> [!TIP]
> 参照の有効範囲は「最後に使われた地点」までです。不変参照を使い終わってから可変参照を作るなら OK。

### ダングリング参照は作れない

```rust {class="compile-fail"}
fn dangle() -> &String { // error[E0106]: missing lifetime specifier
    let s = String::from("bye");
    &s // s は関数終了で消えるのに、その参照を返そうとしている
}

fn main() {
    let _r = dangle();
}
```

解決策は参照ではなく `String` そのもの（所有権）を返すことです。

## スライス: 一部分への参照

```rust
fn first_word(s: &str) -> &str {
    for (i, b) in s.bytes().enumerate() {
        if b == b' ' {
            return &s[..i];
        }
    }
    s
}

fn main() {
    let text = String::from("hello world");
    let word = first_word(&text);   // &String → &str に自動変換
    println!("{word}");             // hello
    println!("{}", first_word("rust is fun")); // リテラルも OK

    let nums = [1, 2, 3, 4, 5];
    let mid: &[i32] = &nums[1..4];  // 配列のスライス [2, 3, 4]
    println!("{mid:?}");
}
```

- `&s[a..b]` は a 以上 b 未満。`..b`, `a..`, `..` の省略形あり
- 文字列リテラル `"abc"` の型は `&str`（プログラム中のデータへのスライス）
- 文字列スライスの範囲は **バイト単位**。マルチバイト文字の途中で切ると panic するので注意

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

最後の単語を返す `last_word` を書いてみよう。

```rust {class="exercise"}
fn last_word(s: &str) -> &str {
    todo!("ヒント: s.rfind(' ') で最後の空白の位置がわかる")
}

fn main() {
    println!("{}", last_word("hello wonderful world")); // world
    println!("{}", last_word("rust"));                  // rust
}
```

```rust {class="solution"}
fn last_word(s: &str) -> &str {
    match s.rfind(' ') {
        Some(i) => &s[i + 1..],
        None => s,
    }
}

fn main() {
    println!("{}", last_word("hello wonderful world")); // world
    println!("{}", last_word("rust"));                  // rust
}
```

## 📝 まとめ

- `&` で借りる、`&mut` で書き換え可能に借りる
- 「不変参照は複数 OK / 可変参照は 1 つだけ」でデータ競合を防ぐ
- 文字列を受け取る関数の引数は `&str` が便利

## ✅ 理解度クイズ

{{< quiz >}}
