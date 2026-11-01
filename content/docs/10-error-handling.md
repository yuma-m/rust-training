---
title: "10. エラー処理"
weight: 100
quiz:
  - q: "回復可能なエラー（ファイルが無い、入力が不正など）を表すのに使う型は？"
    choices:
      - "`panic!`"
      - "`Option<T>`"
      - "`Result<T, E>`"
      - "`Error<T>`"
    answer: 2
    explain: "`Result<T, E>` は成功 `Ok(T)` か失敗 `Err(E)` を表します。`panic!` は回復不能なバグ用です。"
  - q: "`let n = s.parse::<i32>()?;` の `?` が行うことは？"
    choices:
      - "`Err` なら panic する"
      - "`Err` なら呼び出し元にそのエラーを返し、`Ok` なら中身を取り出す"
      - "`Err` を無視して 0 にする"
      - "値を `Option` に変換する"
    answer: 1
    explain: "`?` は「失敗したら早期リターン」の省略記法です。必要に応じて `From` トレイトでエラー型も変換されます。"
  - q: "次のコードはコンパイルできる？"
    code: |
      fn main() {
          let n: i32 = "42".parse()?;
          println!("{n}");
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "`?` は `Result`（または `Option`）を返す関数の中でしか使えません。`fn main() -> Result<(), Box<dyn std::error::Error>>` のように戻り値を変えれば使えます。"
  - q: "`unwrap()` と `expect(\"msg\")` の違いは？"
    choices:
      - "`expect` は panic しない"
      - "panic 時に表示するメッセージを指定できるのが `expect`"
      - "`unwrap` は `Option` 専用"
      - "違いはない"
    answer: 1
    explain: "どちらも失敗時に panic しますが、`expect` は理由を書けるのでデバッグしやすくなります。"
---

# 10. エラー処理: panic! と Result

## 🎯 この章のゴール

- 回復不能なエラー（`panic!`）と回復可能なエラー（`Result`）を使い分ける
- `?` 演算子でエラーをスッキリ伝播させる

## 💡 ひとことで言うと

> Rust に例外はありません。失敗するかもしれない関数は **戻り値の型で「失敗するかも」と宣言** します。無視するとコンパイラに注意されます。

## panic!: 回復不能なエラー

```rust {class="nocheck"}
fn main() {
    let v = vec![1, 2, 3];
    v[99]; // thread 'main' panicked at ... index out of bounds
}
```

`panic!` はプログラムを停止します。**バグ**（ありえない状態）のときに使います。
`RUST_BACKTRACE=1 cargo run` で呼び出し履歴を表示できます。

## Result: 回復可能なエラー

```rust
// enum Result<T, E> { Ok(T), Err(E) }
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = match File::open("hello.txt") {
        Ok(file) => file,
        Err(e) if e.kind() == ErrorKind::NotFound => {
            println!("ファイルがないので作ります");
            File::create("hello.txt").expect("作成に失敗")
        }
        Err(e) => panic!("開けません: {e:?}"),
    };
    println!("{f:?}");
}
```

## ? 演算子: エラーの伝播

```rust
use std::fs;
use std::io;

// match で書くと…
fn read_name_verbose() -> Result<String, io::Error> {
    let s = match fs::read_to_string("name.txt") {
        Ok(s) => s,
        Err(e) => return Err(e),
    };
    Ok(s.trim().to_string())
}

// ? を使うと同じことが 1 行に！
fn read_name() -> Result<String, io::Error> {
    let s = fs::read_to_string("name.txt")?;
    Ok(s.trim().to_string())
}

fn main() {
    println!("{:?}", read_name_verbose().is_err());
    println!("{:?}", read_name());
}
```

`?` は `Option` を返す関数でも使えます（`None` なら即 `None` を返す）。

```rust
fn first_char_upper(s: &str) -> Option<char> {
    let c = s.chars().next()?;
    Some(c.to_ascii_uppercase())
}

fn main() {
    println!("{:?} {:?}", first_char_upper("rust"), first_char_upper(""));
}
```

## main から Result を返す

```rust
use std::error::Error;

fn main() -> Result<(), Box<dyn Error>> {
    let n: i32 = "42".parse()?;   // ParseIntError
    let text = std::fs::read_to_string("Cargo.toml").unwrap_or_default();
    println!("{n} {}", text.len());
    Ok(())
}
```

`Box<dyn Error>` は「何らかのエラー」を表す型で、異なる種類のエラーを `?` でまとめて扱えます。

## 使い分けの指針

| 状況 | 使うもの |
|---|---|
| 呼び出し側が対処できる失敗（ファイルなし、入力ミス） | `Result` を返す |
| バグ・ありえない状態 | `panic!` |
| サンプル・試作・テスト | `unwrap()` / `expect()` で OK |
| 絶対に失敗しないと分かっている | `expect("理由")` で意図を残す |

> [!TIP]
> アプリケーションでは [`anyhow`](https://crates.io/crates/anyhow)、ライブラリでは [`thiserror`](https://crates.io/crates/thiserror) クレートがよく使われます。

## 🧪 やってみよう

文字列 `"3,5"` を受け取り、2 つの数の和を返す `fn sum_pair(s: &str) -> Result<i32, Box<dyn std::error::Error>>` を `?` を使って書いてみよう。

## 📝 まとめ

- 回復不能 → `panic!`、回復可能 → `Result<T, E>`
- `?` で「失敗なら早期リターン」を簡潔に
- `?` は `Result` / `Option` を返す関数の中でだけ使える

## ✅ 理解度クイズ

{{< quiz >}}
