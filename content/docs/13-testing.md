---
title: "13. テストを書く"
weight: 130
quiz:
  - q: "関数をテストとして認識させるために付ける属性は？"
    choices:
      - "`#[test]`"
      - "`#[cfg(test)]`"
      - "`#[derive(Test)]`"
      - "`#[unit]`"
    answer: 0
    explain: "`#[test]` を付けた関数が `cargo test` で実行されます。`#[cfg(test)]` は「テスト時だけコンパイルする」ためにモジュールに付けます。"
  - q: "「この関数は panic するはず」をテストするには？"
    choices:
      - "`#[should_panic]` を付ける"
      - "`assert!(panic!())` と書く"
      - "`#[ignore]` を付ける"
      - "テストできない"
    answer: 0
    explain: "`#[should_panic]`（必要なら `expected = \"メッセージの一部\"`）を付けると、panic したときに成功になります。"
  - q: "結合テスト（integration test）を置くディレクトリは？"
    choices:
      - "`src/tests/`"
      - "`tests/`（`src` と同じ階層）"
      - "`test/unit/`"
      - "`benches/`"
    answer: 1
    explain: "プロジェクト直下の `tests/` 内の各ファイルは独立したクレートとしてコンパイルされ、ライブラリの **公開 API** だけを使ってテストします。"
  - q: "ユニットテストから非公開関数をテストできる？"
    choices:
      - "できる（同じファイルの子モジュールなので親の非公開アイテムにアクセスできる）"
      - "できない（`pub` が必須）"
    answer: 0
    explain: "`mod tests` は子モジュールなので、`use super::*;` で親の非公開関数も使えます。"
---

# 13. テストを書く

## 🎯 この章のゴール

- `#[test]` と `assert!` 系マクロでユニットテストを書く
- `cargo test` の便利なオプションを知る
- ユニットテストと結合テストの違いを理解する

## 💡 ひとことで言うと

> Rust ではテストは **言語とツールに標準装備**。追加ライブラリなしで、コードのすぐ隣にテストを書けます。

## 最初のテスト

`cargo new --lib calc` でライブラリを作ると、テストのひな形が入っています。

```rust {class="nocheck"}
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn is_even(n: i32) -> bool {   // 非公開関数
    n % 2 == 0
}

pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("ゼロ除算");
    }
    a / b
}

#[cfg(test)]           // cargo test のときだけコンパイル
mod tests {
    use super::*;      // 親モジュールのアイテムを全部使う

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn private_fn_is_testable() {
        assert!(is_even(4), "4 は偶数のはず");
        assert_ne!(is_even(3), true);
    }

    #[test]
    #[should_panic(expected = "ゼロ除算")]
    fn divide_by_zero_panics() {
        divide(1, 0);
    }

    #[test]
    fn using_result() -> Result<(), String> {
        if add(1, 1) == 2 { Ok(()) } else { Err("計算がおかしい".into()) }
    }
}
```

```sh
$ cargo test
running 4 tests
test tests::adds_two_numbers ... ok
test tests::private_fn_is_testable ... ok
test tests::divide_by_zero_panics - should panic ... ok
test tests::using_result ... ok

test result: ok. 4 passed; 0 failed
```

## アサーションマクロ

| マクロ | 成功条件 |
|---|---|
| `assert!(cond)` | `cond` が `true` |
| `assert_eq!(a, b)` | `a == b`（失敗時に両方の値を表示） |
| `assert_ne!(a, b)` | `a != b` |

どれも末尾にメッセージ（`format!` と同じ書式）を追加できます。

## cargo test の便利オプション

```sh
cargo test adds            # 名前に "adds" を含むテストだけ実行
cargo test -- --nocapture  # println! の出力を表示
cargo test -- --ignored    # #[ignore] を付けた重いテストを実行
cargo test --doc           # ドキュメントテストだけ
```

## 結合テスト

```text
calc/
├── src/lib.rs
└── tests/
    └── api.rs
```

```rust {class="nocheck norun"}
// tests/api.rs — 外部のユーザーと同じ立場でテスト
use calc::add;

#[test]
fn add_from_outside() {
    assert_eq!(add(10, 20), 30);
}
```

> [!TIP]
> `///` で書くドキュメントコメント内のコード例も `cargo test` で実行されます（ドキュメントテスト）。ドキュメントが古くなるのを防げる優れものです。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

平均値を返す関数にテストを書いてみよう。**▶ 実行（テスト）** で `cargo test` 相当が走ります。

```rust {class="exercise"}
pub fn mean(v: &[i32]) -> Option<f64> {
    if v.is_empty() {
        return None;
    }
    Some(v.iter().sum::<i32>() as f64 / v.len() as f64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mean_of_values() {
        todo!("assert_eq!(mean(&[1, 2, 3]), Some(2.0)) のように確かめよう")
    }

    #[test]
    fn mean_of_empty() {
        todo!("空のときは None")
    }
}
```

## 📝 まとめ

- `#[cfg(test)] mod tests` + `#[test]` でユニットテスト
- `assert!` / `assert_eq!` / `#[should_panic]`
- `tests/` ディレクトリで公開 API の結合テスト

## ✅ 理解度クイズ

{{< quiz >}}
