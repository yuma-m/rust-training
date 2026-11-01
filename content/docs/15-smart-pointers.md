---
title: "15. スマートポインタ"
weight: 150
quiz:
  - q: "再帰的なデータ構造（リストや木）で `Box<T>` が必要になる理由は？"
    choices:
      - "ヒープに置くと速くなるから"
      - "再帰的な型はコンパイル時にサイズが決まらないが、`Box` はポインタなのでサイズが固定されるから"
      - "`Box` を使うとスレッド安全になるから"
      - "所有権を複数持てるから"
    answer: 1
    explain: "`enum List { Cons(i32, List), Nil }` は無限に大きくなりえます。`Box<List>` にすればポインタ 1 個分のサイズで済みます。"
  - q: "次のコードで最後に表示される値は？"
    code: |
      use std::rc::Rc;

      fn main() {
          let a = Rc::new(5);
          let b = Rc::clone(&a);
          {
              let c = Rc::clone(&a);
          }
          println!("{}", Rc::strong_count(&a));
      }
    choices:
      - "`1`"
      - "`2`"
      - "`3`"
      - "`5`"
    answer: 1
    explain: "`a`, `b`, `c` で 3 になりますが、`c` はブロックを抜けて drop されるので 2 です。"
  - q: "`RefCell<T>` で、`borrow_mut()` 中にさらに `borrow_mut()` するとどうなる？"
    choices:
      - "コンパイルエラー"
      - "実行時に panic"
      - "2 つ目は無視される"
      - "正常に動く"
    answer: 1
    explain: "`RefCell` は借用ルールのチェックを **実行時** に行います。ルール違反はコンパイルエラーではなく panic になります。"
  - q: "複数の所有者がいて、かつ中身を書き換えたい（シングルスレッド）。定番の組み合わせは？"
    choices:
      - "`Box<Rc<T>>`"
      - "`Rc<RefCell<T>>`"
      - "`RefCell<Box<T>>`"
      - "`Rc<T>` だけで十分"
    answer: 1
    explain: "`Rc` で共有所有、`RefCell` で内部可変性。`Rc<RefCell<T>>` はシングルスレッドでの定番パターンです（マルチスレッドなら `Arc<Mutex<T>>`）。"
---

# 15. スマートポインタ

## 🎯 この章のゴール

- `Box<T>` でヒープに値を置く
- `Rc<T>` で 1 つの値を複数で所有する
- `RefCell<T>` で「内部可変性」を使う

## 💡 ひとことで言うと

> スマートポインタは **おまけ機能付きのポインタ**。`Box` は「ヒープに置く」、`Rc` は「みんなで持つ（参照カウント）」、`RefCell` は「借用チェックを実行時に回す」機能付きです。

## 早見表

| 型 | 所有者 | 可変性 | 借用チェック | 用途 |
|---|---|---|---|---|
| `Box<T>` | 1 つ | `mut` なら可 | コンパイル時 | ヒープ確保、再帰型、トレイトオブジェクト |
| `Rc<T>` | 複数 | 不変のみ | コンパイル時 | グラフ・共有データ |
| `RefCell<T>` | 1 つ | 内部可変 | **実行時** | `&self` から書き換えたい |

## Box\<T\>: ヒープに置く

```rust
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>), // Box がないと「サイズが無限」でコンパイルエラー
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let b = Box::new(5);
    println!("b = {}", *b + 1);  // * で中身を取り出す（Deref）

    let list = Cons(1, Box::new(Cons(2, Box::new(Nil))));
    println!("{list:?}");
}
```

`Box` は `Deref` トレイトで普通の参照のように使え、`Drop` トレイトでスコープを抜けると中身も解放されます。

## Rc\<T\>: 参照カウントで共有

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("みんなのデータ"));
    let a = Rc::clone(&shared); // 中身はコピーせず、カウントを +1
    {
        let b = Rc::clone(&shared);
        println!("count = {}", Rc::strong_count(&shared)); // 3
        println!("{b}");
    }
    println!("count = {}", Rc::strong_count(&shared));     // 2
    println!("{a}");
}
```

カウントが 0 になったときに値が解放されます。`Rc` は **シングルスレッド専用** です（マルチスレッドは 16 章の `Arc`）。

## RefCell\<T\>: 内部可変性

不変な参照しか持っていなくても、中身を書き換えられるようにします。借用ルールは **実行時** にチェックされます。

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
struct Account {
    balance: RefCell<i32>,
}

fn main() {
    let acc = Rc::new(Account { balance: RefCell::new(100) });
    let alice = Rc::clone(&acc);
    let bob = Rc::clone(&acc);

    *alice.balance.borrow_mut() += 50;  // 共有しているのに書き換えられる！
    *bob.balance.borrow_mut() -= 30;

    println!("残高: {}", acc.balance.borrow()); // 120
}
```

> [!WARNING]
> `RefCell` で `borrow_mut()` を同時に 2 つ取ると、コンパイルは通っても **実行時に panic** します。コンパイル時チェックで済むなら、まずは普通の `&mut` を使いましょう。

> [!NOTE]
> `Rc` 同士がお互いを指す **循環参照** を作るとメモリリークします。親への参照のような「逆向き」のリンクには `Weak<T>`（`Rc::downgrade`）を使います。

## 🧪 やってみよう

`Rc<RefCell<Vec<String>>>` で「共有 TODO リスト」を作り、2 つの変数から別々に `push` して、最後に全部表示してみよう。

## 📝 まとめ

- `Box<T>`: ヒープ確保。再帰型やトレイトオブジェクトに
- `Rc<T>`: 参照カウントで複数所有（シングルスレッド）
- `RefCell<T>`: 実行時借用チェックで内部可変性。`Rc<RefCell<T>>` が定番

## ✅ 理解度クイズ

{{< quiz >}}
