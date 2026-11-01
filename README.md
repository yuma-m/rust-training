# 楽しく学ぶ Rust

[The Rust Programming Language 日本語版](https://doc.rust-jp.rs/book-ja/) を参考に、Rust の重要な概念を短く・楽しく学べるようにまとめたコースです。
各章の最後にある選択式クイズで、理解度を確かめながら進められます。

[Hugo](https://gohugo.io/) と [Hugo Book](https://github.com/alex-shpak/hugo-book) テーマで作っています。

## 起動方法

```sh
git submodule update --init --recursive
hugo server
```

http://localhost:1313/ を開きます。静的サイトをビルドするには `hugo --gc --minify` を実行します（出力先は `public/`）。

## 構成

- `content/docs/NN-*.md` — 1 章 1 ファイル。並び順は front matter の `weight` で決まる
- `layouts/_shortcodes/quiz.html` — ページの front matter に書いたクイズを表示する
- `layouts/_shortcodes/progress.html` — トップページの章ごとの進捗表
- `assets/quiz.js` — 正誤判定・スコア表示。結果はブラウザの `localStorage` に保存する
- `layouts/_markup/render-codeblock-rust.html` — Rust のコードブロックに「▶ 実行」「Playground で開く」を付ける
- `assets/playground.js` — [Rust Playground](https://play.rust-lang.org/) の API でコードを実行し、結果をページ内に表示する
- `assets/styles/custom.css` — クイズ・コードブロック・実行結果のスタイル
- `scripts/check_code.py` — コード例の検証スクリプト

## 章の書き方

クイズは各章の front matter に書き（`answer` は 0 始まりの番号）、表示したい場所に `{{< quiz >}}` を置きます。

```yaml
quiz:
  - q: "次のコードはコンパイルできる？"
    code: |
      let s1 = String::from("hi");
      let s2 = s1;
      println!("{s1}");
    choices: ["できる", "できない"]
    answer: 1
    explain: "`s1` の所有権は `s2` にムーブ済みです。"
```

コードブロックには次の属性を付けられます。

- ```` ```rust {class="compile-fail"} ```` — コンパイルに失敗する想定の例。赤枠と「❌ コンパイルエラー」ラベルが付く
- ```` ```rust {class="exercise"} ```` — 「やってみよう」の書きかけコード。破線枠と「✏️ 書きかけコード」ラベルが付く
- ```` ```rust {class="nocheck"} ```` — 検証スクリプトの対象外（外部クレートを使う例など）
- ```` ```rust {class="norun"} ```` — 「▶ 実行」ボタンを出さない（キーボード入力が必要な例など）

属性は `{class="exercise compile-fail"}` のように空白区切りで組み合わせられます。

「▶ 実行」ボタンは `fn main` を含むブロックに付きます。`fn main` がなく `#[test]` を含むブロックはテストとして実行されます。それ以外のブロックには「Playground で開く」リンクだけが付きます。

## コード例の検証

[uv](https://docs.astral.sh/uv/) で実行します（依存の PyYAML は自動で入ります）。

```sh
uv run scripts/check_code.py content/docs/[0-9]*.md
```

次の内容をチェックします。

- 本文の `rust` コードブロックを `rustc --edition 2024` ですべてコンパイルする
- `compile-fail` のブロックは失敗し、それ以外は成功することを確認する
- クイズの `answer` が選択肢の範囲内かを確認する
- クイズのコードがコンパイルできるかを表示する（正解の選択肢と見比べる用）
