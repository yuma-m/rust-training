---
title: "16. 恐れるな！並行性"
weight: 160
quiz:
  - q: "次のコードはコンパイルできる？"
    code: |
      use std::thread;

      fn main() {
          let v = vec![1, 2, 3];
          let h = thread::spawn(|| {
              println!("{v:?}");
          });
          h.join().unwrap();
      }
    choices:
      - "できる"
      - "できない"
    answer: 1
    explain: "スレッドは `main` より長生きするかもしれないので、`v` を借用するだけのクロージャは渡せません。`thread::spawn(move || ...)` で所有権を移します。（`thread::scope` を使えば借用も可能です）"
  - q: "複数スレッドで値を共有して書き換えたい。正しい組み合わせは？"
    choices:
      - "`Rc<RefCell<T>>`"
      - "`Arc<Mutex<T>>`"
      - "`Box<T>`"
      - "`Rc<Mutex<T>>`"
    answer: 1
    explain: "`Rc` はスレッド安全ではない（`Send` でない）ので、スレッド間ではアトミックな参照カウントの `Arc` を使います。書き換えは `Mutex` で排他制御します。"
  - q: "チャネル `mpsc` の名前の意味は？"
    choices:
      - "multiple producer, single consumer（送信側は複数、受信側は 1 つ）"
      - "multi process, shared channel"
      - "message passing, synchronous call"
      - "main process, sub channel"
    answer: 0
    explain: "`tx.clone()` で送信側を増やせますが、受信側 `rx` は 1 つです。"
  - q: "データ競合のあるコードを書いてしまったら、Rust ではいつ発覚する？"
    choices:
      - "本番環境で稀にクラッシュしたとき"
      - "テスト実行時"
      - "コンパイル時"
      - "発覚しない"
    answer: 2
    explain: "所有権・借用ルールと `Send` / `Sync` トレイトによって、データ競合は **コンパイルエラー** になります。これが「恐れるな並行性（fearless concurrency）」です。"
---

# 16. 恐れるな！並行性

## 🎯 この章のゴール

- スレッドを起動して `move` クロージャでデータを渡す
- チャネルでメッセージをやりとりする
- `Arc<Mutex<T>>` で状態を共有する

## 💡 ひとことで言うと

> 並行プログラミングのバグ（データ競合）は、普通は **実行してみないと分からない** 厄介者。Rust では所有権のおかげで **コンパイラが事前に止めてくれます**。

## スレッドを起動する

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let names = vec!["Alice", "Bob"];

    let handle = thread::spawn(move || { // names の所有権をスレッドへ
        for n in &names {
            println!("スレッド: こんにちは {n}");
            thread::sleep(Duration::from_millis(1));
        }
    });

    println!("main: 待っています…");
    handle.join().unwrap(); // スレッドの終了を待つ
}
```

`move` がないと「スレッドより先に `names` が破棄されるかも」とコンパイルエラーになります。

> [!TIP]
> `thread::scope(|s| { s.spawn(|| ...); })` を使うと、スコープ内で必ずスレッドが終わるので **借用のまま** データを渡せます。

## メッセージパッシング: チャネル

> 「メモリを共有して通信するな、通信してメモリを共有せよ」— Go 言語のスローガンより

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for id in 0..3 {
        let tx = tx.clone();             // 送信側は複製できる
        thread::spawn(move || {
            tx.send(format!("worker {id} 完了")).unwrap();
        });
    }
    drop(tx); // 元の送信側を閉じる（全部閉じると受信ループが終わる）

    for msg in rx {                      // 受信側はイテレータとして使える
        println!("{msg}");
    }
}
```

`send` した値の所有権は受信側に移るので、送信後に誤って使うこともできません。

## 状態の共有: Arc\<Mutex\<T\>\>

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut n = counter.lock().unwrap(); // ロック取得
            *n += 1;
        }));                                     // n が drop されると自動でアンロック
    }

    for h in handles {
        h.join().unwrap();
    }
    println!("結果: {}", *counter.lock().unwrap()); // 10
}
```

| シングルスレッド | マルチスレッド |
|---|---|
| `Rc<T>` | `Arc<T>`（Atomic Rc） |
| `RefCell<T>` | `Mutex<T>` / `RwLock<T>` |

## Send と Sync

- **`Send`**: 所有権を別スレッドに **送れる** 型
- **`Sync`**: 参照を複数スレッドから **共有できる** 型

ほとんどの型は自動でこれらを実装します。`Rc<T>` は `Send` ではないので、スレッドに渡そうとするとコンパイルエラー。だから間違えようがないのです。

## 🧪 やってみよう

下の書きかけコードの `TODO` を埋めて、**▶ 実行** で確かめよう。`todo!()` のままだと実行時に panic します。

1〜1,000,000 の合計を 4 つのスレッドで分担して計算し、チャネルで部分和を集めよう。

```rust {class="exercise"}
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel::<u64>();

    for i in 0..4u64 {
        let tx = tx.clone();
        let (start, end) = (i * 250_000 + 1, (i + 1) * 250_000);
        thread::spawn(move || {
            // TODO: start..=end の合計を計算して tx.send(...) しよう
            let _ = (start, end, &tx);
        });
    }
    drop(tx);

    let total: u64 = rx.iter().sum();
    println!("合計: {total}（正解は 500000500000）");
}
```

## 📝 まとめ

- `thread::spawn(move || ...)` でスレッド起動、`join` で待機
- チャネル（`mpsc`）で所有権ごとメッセージを送る
- 共有状態は `Arc<Mutex<T>>`。データ競合はコンパイルエラーになる

## ✅ 理解度クイズ

{{< quiz >}}
