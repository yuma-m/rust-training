# Fun Rust Training

A concise, quiz-driven Rust course in Japanese, inspired by
[The Rust Programming Language (Japanese edition)](https://doc.rust-jp.rs/book-ja/).
Built with [Hugo](https://gohugo.io/) and the [Hugo Book](https://github.com/alex-shpak/hugo-book) theme.

## Getting started

```sh
git submodule update --init --recursive
hugo server
```

Open http://localhost:1313/. Build a static site with `hugo --gc --minify` (output in `public/`).

## Structure

- `content/docs/NN-*.md` — one chapter per file, ordered by `weight`
- `layouts/_shortcodes/quiz.html` — renders the quiz defined in the page front matter
- `layouts/_shortcodes/progress.html` — per-chapter quiz progress table (home page)
- `assets/quiz.js` — answer checking, scoring, progress saved in `localStorage`
- `assets/styles/custom.css` — quiz and `compile-fail` code block styles

## Writing a chapter

Each chapter defines its quiz in front matter (`answer` is a 0-based index) and places
`{{< quiz >}}` where it should appear:

```yaml
quiz:
  - q: "Does this compile?"
    code: |
      let s1 = String::from("hi");
      let s2 = s1;
      println!("{s1}");
    choices: ["Yes", "No"]
    answer: 1
    explain: "`s1` was moved into `s2`."
```

Code block attributes:

- ```` ```rust {class="compile-fail"} ```` — expected to fail compilation (shown with a red badge)
- ```` ```rust {class="nocheck"} ```` — skipped by the checker (external crates, tests, etc.)

## Checking code samples

```sh
ruby scripts/check_code.rb content/docs/[0-9]*.md
```

Compiles every `rust` block with `rustc --edition 2024`, verifies `compile-fail` blocks
fail, validates quiz answer indices, and reports whether each quiz snippet compiles.
