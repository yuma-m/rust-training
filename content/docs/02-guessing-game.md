---
title: "02. 数当てゲームで全体像"
weight: 20
quiz:
  - q: "標準入力から 1 行読む `read_line(&mut guess)` に `&mut` が付いている理由は？"
    choices:
      - "`guess` を読み取り専用で渡すため"
      - "`read_line` が `guess` の中身を書き換えるため"
      - "`guess` を関数にムーブするため"
      - "文字列を数値に変換するため"
    answer: 1
    explain: "`read_line` は受け取った文字列に入力を **追記** します。中身を書き換えるには可変参照 `&mut` が必要です。参照については 05 章で詳しく学びます。"
  - q: "次のコードで `guess` の型は最終的に何になる？"
    code: |
      let guess = String::from("42");
      let guess: u32 = guess.trim().parse().expect("数字を入力して");
    choices:
      - "`String`"
      - "`&str`"
      - "`u32`"
      - "`Result<u32, ParseIntError>`"
    answer: 2
    explain: "同じ名前で `let` し直す **シャドーイング** により、新しい `guess` は `u32` 型になります。`parse()` が返すのは `Result` ですが、`expect` で中身を取り出しています。"
  - q: "`match guess.cmp(&secret)` の各アームとして使われる値は？"
    choices:
      - "`true` / `false`"
      - "`-1` / `0` / `1`"
      - "`Ordering::Less` / `Ordering::Greater` / `Ordering::Equal`"
      - "`Some` / `None`"
    answer: 2
    explain: "`cmp` は `std::cmp::Ordering` という enum を返します。`match` はすべてのバリアントを網羅しないとコンパイルエラーになるので、場合分けの漏れを防げます。"
---

# 02. 数当てゲームで全体像

## 🎯 この章のゴール

- 小さなゲームを作りながら、Rust の主要な要素を **ざっと** 眺める
- 細かい理解は後の章に任せて「こんな感じか」を掴む

## 💡 ひとことで言うと

> 映画の予告編のような章です。変数・外部クレート・`match`・エラー処理・ループが一度に登場します。

## 完成形

```rust {class="nocheck"}
use rand::RngExt;
use std::cmp::Ordering;
use std::io;

fn main() {
    println!("1〜100 の数を当ててね！");
    let secret = rand::rng().random_range(1..=100);

    loop {
        println!("予想を入力:");
        let mut guess = String::new();
        io::stdin()
            .read_line(&mut guess)
            .expect("読み込みに失敗しました");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue, // 数字以外は無視してやり直し
        };

        match guess.cmp(&secret) {
            Ordering::Less => println!("もっと大きい！"),
            Ordering::Greater => println!("もっと小さい！"),
            Ordering::Equal => {
                println!("正解！🎉");
                break;
            }
        }
    }
}
```

乱数のために外部クレート `rand` を使います。`Cargo.toml` に追記するか、コマンドで追加します。

```sh
cargo add rand@0.10
```

## 登場した要素ダイジェスト

| コード | 意味 | 詳しくは |
|---|---|---|
| `let mut guess` | 変更可能な変数 | 03 章 |
| `&mut guess` | 可変参照を渡す | 05 章 |
| `.expect("...")` | 失敗したら panic してメッセージ表示 | 10 章 |
| `let guess: u32 = ...` | 同名で再定義（シャドーイング） | 03 章 |
| `match` | 値に応じて分岐、網羅性をチェック | 07 章 |
| `Ok(num)` / `Err(_)` | `Result` 型で成功・失敗を表す | 10 章 |
| `loop` / `break` / `continue` | 無限ループと脱出 | 03 章 |

> [!TIP]
> Rust の変数は **デフォルトで不変** です。書き換えたいときだけ `mut` を付けます。「どこで値が変わりうるか」がコードから一目でわかるようになります。

## 🧪 やってみよう

1. 何回目で当たったかを数えて、正解時に「5 回で正解！」と表示してみよう
2. 1〜100 の範囲外の数が入力されたら注意メッセージを出してみよう

## 📝 まとめ

- 外部クレートは `cargo add` で追加し、`use` で取り込む
- `Result` は `match` や `expect` で扱う
- `match` は全パターンを網羅しないとコンパイルが通らない

## ✅ 理解度クイズ

{{< quiz >}}
