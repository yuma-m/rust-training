---
title: "12. ライフタイム"
weight: 120
quiz:
  - q: "ライフタイム注釈 `'a` の役割として正しいものは？"
    choices:
      - "参照の生存期間を延ばす"
      - "複数の参照の生存期間の **関係** をコンパイラに伝える"
      - "メモリの解放タイミングを指定する"
      - "参照を所有権に変える"
    answer: 1
    explain: "ライフタイム注釈は寿命を変えません。「戻り値の参照は引数と同じだけ有効」といった関係を記述し、借用チェッカーが検証できるようにします。"
  - q: "次のコードはコンパイルできる？"
    code: |
      fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
          if x.len() > y.len() { x } else { y }
      }

      fn main() {
          let a = String::from("long string");
          let result;
          {
              let b = String::from("xyz");
              result = longest(a.as_str(), b.as_str());
          }
          println!("{result}");
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "`'a` は `a` と `b` の **短い方** の寿命になります。`b` は内側のブロックで破棄されるので、その外で `result` を使うとダングリングの恐れがありエラーです。"
  - q: "次の関数はライフタイム注釈なしでコンパイルできる？"
    code: |
      fn first_word(s: &str) -> &str {
          s.split(' ').next().unwrap_or("")
      }
    choices:
      - "できる（省略規則で推論される）"
      - "できない（`'a` が必須）"
    answer: 0
    explain: "入力の参照が 1 つだけなら、出力の参照はそれと同じライフタイムだと **省略規則** で推論されます。"
  - q: "`&'static str` の `'static` が意味するのは？"
    choices:
      - "定数でなければならない"
      - "プログラムの実行中ずっと有効な参照"
      - "スタックに置かれた参照"
      - "スレッド間で共有できない参照"
    answer: 1
    explain: "文字列リテラルはバイナリに埋め込まれるため `'static` です。エラー解決のために安易に `'static` を付けるのは避けましょう。"
---

# 12. ライフタイム

## 🎯 この章のゴール

- ライフタイムが **何を防いでいるのか** を理解する
- 関数・構造体にライフタイム注釈を付けられるようになる
- 省略規則を知り、書かなくていい場面を見分ける

## 💡 ひとことで言うと

> ライフタイムは **参照の賞味期限ラベル**。「この戻り値は、引数たちの賞味期限のうち短い方まで有効です」とコンパイラに伝えます。

## 何を防いでいる？

```rust {class="compile-fail"}
fn main() {
    let r;
    {
        let x = 5;
        r = &x;      // error[E0597]: `x` does not live long enough
    }                // x はここで消える
    println!("{r}"); // 消えた x を指す参照（ダングリング）を使おうとしている
}
```

**借用チェッカー** は「参照先が参照より長生きしているか」をコンパイル時に確認します。

## 関数のライフタイム注釈

2 つの参照のどちらかを返す関数は、戻り値がどちらの寿命に従うのかコンパイラには分かりません。

```rust {class="compile-fail"}
fn longest(x: &str, y: &str) -> &str { // error[E0106]: missing lifetime specifier
    if x.len() > y.len() { x } else { y }
}

fn main() {
    println!("{}", longest("ab", "c"));
}
```

`'a` で関係を明示します。

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let a = String::from("abcd");
    let b = "xyz";
    println!("{}", longest(a.as_str(), b)); // abcd
}
```

読み方: 「`x` と `y` が両方とも有効な期間 `'a` の間、戻り値も有効」。
つまり戻り値は **短い方** の寿命に縛られます。

## 構造体のライフタイム

構造体に参照を持たせるなら、注釈が必要です。

```rust
struct Excerpt<'a> {
    part: &'a str, // Excerpt は part の参照先より長生きできない
}

impl<'a> Excerpt<'a> {
    fn part(&self) -> &str {
        self.part
    }
}

fn main() {
    let novel = String::from("昔々あるところに。おじいさんとおばあさんが…");
    let first = novel.split('。').next().unwrap();
    let e = Excerpt { part: first };
    println!("{}", e.part());
}
```

## 省略規則: 書かなくていい場面

毎回書くのは大変なので、次の規則で推論できる場合は省略できます。

1. 引数の各参照に、それぞれ別のライフタイムが付く
2. 入力の参照が **1 つだけ** なら、出力はそのライフタイム
3. メソッドで `&self` / `&mut self` があれば、出力は `self` のライフタイム

ほとんどのケースは規則 2・3 でカバーされるので、実際に注釈を書くのは「参照を 2 つ以上受け取り、参照を返す関数」や「参照を持つ構造体」くらいです。

> [!TIP]
> ライフタイムで詰まったら、**参照ではなく所有する値（`String` など）を返す/持つ** のも立派な解決策です。最初から完璧に借用しようとしなくて大丈夫。

## 'static

```rust
fn main() {
    let s: &'static str = "プログラム終了まで有効";
    println!("{s}");
}
```

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

2 つの文字列スライスのうち、辞書順で小さい方を返す関数を書いてみよう。

```rust {class="exercise"}
fn smaller<'a>(a: &'a str, b: &'a str) -> &'a str {
    todo!("ヒント: &str は < で比較できる")
}

fn main() {
    println!("{}", smaller("banana", "apple")); // apple
}
```

```rust {class="solution"}
fn smaller<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a < b { a } else { b }
}

fn main() {
    println!("{}", smaller("banana", "apple")); // apple
}
```

## 📝 まとめ

- ライフタイムはダングリング参照を防ぐための仕組み
- 注釈は寿命を変えず、参照同士の **関係** を表す
- 省略規則のおかげで、書く必要がある場面は意外と少ない

## ✅ 理解度クイズ

{{< quiz >}}
