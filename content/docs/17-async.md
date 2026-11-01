---
title: "17. async/await 入門"
weight: 170
quiz:
  - q: "`async fn fetch() -> String` を呼び出して `fetch()` と書いただけのとき、何が起きる？"
    choices:
      - "すぐに処理が実行され `String` が返る"
      - "処理はまだ実行されず、`Future` が返るだけ"
      - "新しいスレッドで実行が始まる"
      - "コンパイルエラー"
    answer: 1
    explain: "Rust の Future は **怠惰** です。`.await` するか、ランタイムに渡すまで実行されません。"
  - q: "スレッドと比べた async の主な利点は？"
    choices:
      - "CPU を大量に使う計算が速くなる"
      - "待ち時間の多い処理（ネットワーク I/O など）を少ないスレッドで大量に捌ける"
      - "データ競合が起きなくなる"
      - "ランタイムが不要になる"
    answer: 1
    explain: "async は「待っている間に他の仕事をする」ための仕組みで、I/O バウンドな処理に向いています。CPU バウンドな計算にはスレッドが向いています。"
  - q: "`async fn main()` を標準ライブラリだけで書けない理由は？"
    choices:
      - "Rust の標準ライブラリには Future を実行する **ランタイム（エグゼキュータ）** が含まれていないから"
      - "async は nightly でしか使えないから"
      - "main は `Result` を返す必要があるから"
      - "書ける"
    answer: 0
    explain: "Rust は言語として `async`/`await` を提供しますが、実行するランタイムは `tokio` などのクレートから選びます。`#[tokio::main]` がその橋渡しをします。"
  - q: "2 つの Future を **並行に** 実行して両方の完了を待つには？"
    choices:
      - "`a.await; b.await;`"
      - "`tokio::join!(a, b)`"
      - "`a + b`"
      - "`thread::spawn(a)`"
    answer: 1
    explain: "`a.await; b.await;` は順番に実行されます。`join!` を使うと同時に進行させ、両方の完了を待てます。"
---

# 17. async/await 入門

## 🎯 この章のゴール

- `async` / `await` と `Future` の関係を理解する
- ランタイム（tokio）を使って非同期コードを動かす
- スレッドとの使い分けを知る

## 💡 ひとことで言うと

> async は **ラーメン屋の呼び出しベル**。注文（リクエスト）したら席で待ち続けるのではなく、ベルが鳴るまで他のことをしていられます。

## 同期 vs 非同期

```text
同期:  [A を待つ......][B を待つ......][C を待つ......]
非同期:[A を待つ......]
       [B を待つ......]   ← 待ち時間を重ねられる
       [C を待つ......]
```

Web サーバーのように「待ち」が多い処理では、何千ものリクエストを少ないスレッドで捌けます。

## async と Future

```rust {class="nocheck"}
async fn greet(name: &str) -> String {
    format!("こんにちは、{name}")
}
// ↑ は概念的には次と同じ:
// fn greet(name: &str) -> impl Future<Output = String>
```

- `async fn` を呼ぶと、すぐには実行されず **`Future`（あとで値になるもの）** が返る
- `.await` で Future の完了を待ち、結果を取り出す
- `.await` は `async` の中でしか使えない

## ランタイムで動かす

標準ライブラリには Future を実行する仕組み（ランタイム）が含まれていないので、`tokio` を使います。

```sh
cargo add tokio --features full
```

```rust {class="nocheck"}
use std::time::Duration;
use tokio::time::sleep;

async fn cook(dish: &str, secs: u64) -> String {
    sleep(Duration::from_secs(secs)).await; // 待っている間、他の処理に譲る
    format!("{dish} できあがり！")
}

#[tokio::main]
async fn main() {
    // 順番に待つ: 合計 3 秒
    let a = cook("ラーメン", 2).await;
    let b = cook("餃子", 1).await;
    println!("{a} {b}");

    // 並行に待つ: 合計 2 秒
    let (a, b) = tokio::join!(cook("ラーメン", 2), cook("餃子", 1));
    println!("{a} {b}");

    // タスクとして起動（スレッドより遥かに軽い）
    let handle = tokio::spawn(async { cook("チャーハン", 1).await });
    println!("{}", handle.await.unwrap());
}
```

## 便利な道具

| 道具 | 役割 |
|---|---|
| `tokio::join!(a, b)` | すべて完了するまで待つ |
| `tokio::select! { .. }` | 最初に完了したものを採用（タイムアウト処理など） |
| `tokio::spawn(fut)` | 独立したタスクとして実行 |
| `tokio::sync::mpsc` | async 版チャネル |

## スレッドとの使い分け

| | スレッド | async |
|---|---|---|
| 得意 | CPU を使う計算 | I/O 待ちが多い処理 |
| 1 つあたりのコスト | 重い（数 KB〜MB のスタック） | 軽い（数百バイト程度） |
| 必要なもの | 標準ライブラリだけ | ランタイム（tokio など） |

> [!WARNING]
> async の中で重い計算や `std::thread::sleep` のような **ブロッキング処理** をすると、ランタイム全体が止まってしまいます。重い処理は `tokio::task::spawn_blocking` に逃がしましょう。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

3 品の料理を `tokio::join!` で並行に作って、全体の所要時間を計測してみよう（Playground でも tokio が使えます）。

```rust {class="exercise nocheck"}
use std::time::{Duration, Instant};
use tokio::time::sleep;

async fn cook(dish: &str, secs: u64) -> String {
    sleep(Duration::from_secs(secs)).await;
    format!("{dish} できあがり！")
}

#[tokio::main]
async fn main() {
    let start = Instant::now();

    // TODO: tokio::join! で 3 品を並行に作ろう（今は 1 品ずつ順番）
    let a = cook("ラーメン", 2).await;
    let b = cook("餃子", 1).await;
    let c = cook("チャーハン", 1).await;
    println!("{a} {b} {c}");

    println!("所要時間: {:.1?}", start.elapsed()); // 並行なら約 2 秒
}
```

## 📝 まとめ

- `async fn` は `Future` を返し、`.await` で完了を待つ
- Future は怠惰。実行にはランタイム（tokio など）が必要
- I/O 待ちには async、CPU 計算にはスレッド

## ✅ 理解度クイズ

{{< quiz >}}
