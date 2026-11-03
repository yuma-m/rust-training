---
title: "07. enum とパターンマッチ"
weight: 70
quiz:
  - q: "次のコードはコンパイルできる？"
    code: |
      enum Dir { Up, Down, Left, Right }

      fn name(d: Dir) -> &'static str {
          match d {
              Dir::Up => "上",
              Dir::Down => "下",
              Dir::Left => "左",
          }
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "`match` は **網羅的** でなければなりません。`Dir::Right` が漏れているのでエラーになります。追加するか `_ => ...` で残りをまとめます。"
  - q: "Rust に `null` が無い代わりに使う型は？"
    choices:
      - "`Result<T, E>`"
      - "`Option<T>`"
      - "`Box<T>`"
      - "`Nil`"
    answer: 1
    explain: "値があるかもしれない/無いかもしれない状況は `Option<T>`（`Some(T)` か `None`）で表します。`Option<i32>` は `i32` とは別の型なので、確認せずに使うことはできません。"
  - q: "`if let Some(x) = opt { ... }` の説明として正しいものは？"
    choices:
      - "`opt` が `None` のときだけブロックを実行する"
      - "`opt` が `Some` のときだけ中身を `x` に束縛して実行する"
      - "`opt` を強制的に `Some` に変換する"
      - "`opt` が `None` なら panic する"
    answer: 1
    explain: "`if let` は **1 つのパターンだけ** に興味があるときの `match` の簡略記法です。"
  - q: "次のコードの出力は？"
    code: |
      fn main() {
          let n = 7;
          let s = match n {
              0 => "zero",
              1..=5 => "small",
              x if x % 2 == 1 => "odd",
              _ => "other",
          };
          println!("{s}");
      }
    choices:
      - "`small`"
      - "`odd`"
      - "`other`"
      - "`zero`"
    answer: 1
    explain: "上から順に評価されます。7 は `1..=5` に合わず、マッチガード `x if x % 2 == 1` に合うので `odd` です。"
---

# 07. enum とパターンマッチ

## 🎯 この章のゴール

- データを持てる enum を定義する
- `Option<T>` で「値がないかも」を安全に扱う
- `match` / `if let` / `let else` でパターンマッチする

## 💡 ひとことで言うと

> enum は **「このどれか」を表す型**。`match` は **漏れなく場合分けする仕分け機**。組み合わせると「考え忘れ」がコンパイルエラーになります。

## データを持てる enum

各バリアントが **違う形のデータ** を持てるのが Rust の enum の強みです。

```rust
#[derive(Debug)]
enum Shape {
    Circle(f64),                 // 半径
    Rect { w: f64, h: f64 },     // 名前付きフィールド
    Dot,                         // データなし
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle(r) => 3.14 * r * r,
            Shape::Rect { w, h } => w * h,
            Shape::Dot => 0.0,
        }
    }
}

fn main() {
    let shapes = [Shape::Circle(1.0), Shape::Rect { w: 2.0, h: 3.0 }, Shape::Dot];
    for s in &shapes {
        println!("{s:?} の面積 = {}", s.area());
    }
}
```

## Option: null の代わり

```rust
// 標準ライブラリでの定義（イメージ）
// enum Option<T> { Some(T), None }

fn find_even(nums: &[i32]) -> Option<i32> {
    for &n in nums {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

fn main() {
    match find_even(&[1, 3, 4, 5]) {
        Some(n) => println!("見つけた: {n}"),
        None => println!("なかった"),
    }
}
```

`Option<i32>` は `i32` ではないので、`find_even(..) + 1` のように **中身を確認せずに使うとコンパイルエラー** になります。「null チェック忘れ」が原理的に起きません。

> [!TIP]
> よく使うメソッド: `opt.unwrap_or(0)`（なければ既定値）、`opt.map(|x| x * 2)`（中身を変換）、`opt.is_some()`。`unwrap()` は `None` で panic するので試作用に。

## match のパターン いろいろ

```rust
fn describe(p: (i32, i32)) -> String {
    match p {
        (0, 0) => "原点".to_string(),
        (x, 0) | (0, x) => format!("軸上 ({x})"),   // | で複数パターン
        (x, y) if x == y => "対角線上".to_string(),  // マッチガード
        (1..=9, _) => "x が 1〜9".to_string(),        // 範囲
        _ => "その他".to_string(),                    // ワイルドカード
    }
}

fn main() {
    for p in [(0, 0), (3, 0), (2, 2), (5, 7), (20, 1)] {
        println!("{p:?}: {}", describe(p));
    }
}
```

## if let と let else

1 つのパターンにだけ興味があるときの省略記法です。

```rust
fn parse_age(input: &str) -> Option<u32> {
    let Ok(age) = input.parse::<u32>() else {
        return None; // マッチしなければ早期リターン
    };
    Some(age)
}

fn main() {
    let config: Option<u8> = Some(3);
    if let Some(level) = config {
        println!("レベル {level}");
    } else {
        println!("未設定");
    }
    println!("{:?} {:?}", parse_age("20"), parse_age("abc"));
}
```

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

信号機の enum に、次の色を返す `next` と待ち秒数を返す `wait` を `match` で実装しよう。

```rust {class="exercise"}
#[derive(Debug)]
enum Light {
    Red,
    Yellow,
    Green,
}

impl Light {
    fn next(self) -> Light {
        todo!("赤 → 青 → 黄 → 赤 …")
    }

    fn wait(&self) -> u32 {
        todo!("赤 30 秒、黄 3 秒、青 25 秒")
    }
}

fn main() {
    let mut light = Light::Red;
    for _ in 0..4 {
        println!("{light:?}: {} 秒", light.wait());
        light = light.next();
    }
}
```

```rust {class="solution"}
#[derive(Debug)]
enum Light {
    Red,
    Yellow,
    Green,
}

impl Light {
    fn next(self) -> Light {
        match self {
            Light::Red => Light::Green,
            Light::Green => Light::Yellow,
            Light::Yellow => Light::Red,
        }
    }

    fn wait(&self) -> u32 {
        match self {
            Light::Red => 30,
            Light::Yellow => 3,
            Light::Green => 25,
        }
    }
}

fn main() {
    let mut light = Light::Red;
    for _ in 0..4 {
        println!("{light:?}: {} 秒", light.wait());
        light = light.next();
    }
}
```

## 📝 まとめ

- enum の各バリアントは異なるデータを持てる
- `Option<T>` で「値がない」を型で表現。null 安全
- `match` は網羅性チェック付き。手軽に書くなら `if let` / `let else`

## ✅ 理解度クイズ

{{< quiz >}}
