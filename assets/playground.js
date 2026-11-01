(() => {
  const PLAYGROUND = "https://play.rust-lang.org";
  const EDITION = "2024";
  const NOISE = /^\s*(Compiling|Finished|Running|Doc-tests) /;
  const TIMEOUT_MS = 30000;

  const INDENT = "    ";

  const originalOf = (block) => block.querySelector(".rust-source").value;
  const editorOf = (block) => block.querySelector(".rust-editor");
  const sourceOf = (block) => editorOf(block)?.value ?? originalOf(block);

  const playgroundUrl = (code) =>
    `${PLAYGROUND}/?version=stable&mode=debug&edition=${EDITION}&code=${encodeURIComponent(code)}`;

  const appendPre = (parent, className, text) => {
    const pre = document.createElement("pre");
    pre.className = className;
    pre.textContent = text;
    parent.append(pre);
  };

  const run = async (block, button) => {
    const output = block.querySelector(".rust-output");
    output.hidden = false;
    output.replaceChildren();
    appendPre(output, "rust-output-status", "⏳ Playground で実行中…");
    button.disabled = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${PLAYGROUND}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          channel: "stable",
          mode: "debug",
          edition: EDITION,
          crateType: block.dataset.crateType,
          tests: block.dataset.tests === "true",
          backtrace: false,
          code: sourceOf(block),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const stderr = (data.stderr || "")
        .split("\n")
        .filter((line) => !NOISE.test(line))
        .join("\n")
        .trim();
      const stdout = (data.stdout || "").trim();

      output.replaceChildren();
      appendPre(output, "rust-output-status", data.success ? "✅ 実行結果" : "❌ エラー");
      if (stdout) appendPre(output, "rust-output-stdout", stdout);
      if (stderr) appendPre(output, "rust-output-stderr", stderr);
      if (!stdout && !stderr) appendPre(output, "rust-output-stdout", "（出力なし）");
    } catch (err) {
      output.replaceChildren();
      const reason = err.name === "AbortError" ? "タイムアウトしました" : err.message;
      appendPre(output, "rust-output-stderr", `⚠️ 実行できませんでした: ${reason}`);
    } finally {
      clearTimeout(timer);
      button.disabled = false;
    }
  };

  // Inserting via execCommand keeps the browser's native undo history.
  const insertText = (editor, text) => {
    if (!document.execCommand("insertText", false, text)) {
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, "end");
    }
  };

  const dedentCurrentLine = (editor) => {
    const { value, selectionStart } = editor;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const spaces = value.slice(lineStart).match(/^ {1,4}/)?.[0].length ?? 0;
    if (spaces === 0) return;
    editor.setSelectionRange(lineStart, lineStart + spaces);
    insertText(editor, "");
    const caret = Math.max(lineStart, selectionStart - spaces);
    editor.setSelectionRange(caret, caret);
  };

  const autoResize = (editor) => {
    editor.style.height = "auto";
    editor.style.height = `${editor.scrollHeight + 2}px`;
  };

  const startEditing = (block) => {
    const highlight = block.querySelector(".highlight");
    const editor = document.createElement("textarea");
    editor.className = "rust-editor";
    editor.spellcheck = false;
    editor.setAttribute("autocapitalize", "off");
    editor.setAttribute("autocomplete", "off");
    editor.setAttribute("aria-label", "Rust コードエディタ（Ctrl/Cmd + Enter で実行、Esc でフォーカスを外す）");
    editor.value = originalOf(block);
    highlight.after(editor);
    highlight.hidden = true;

    editor.addEventListener("input", () => autoResize(editor));
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (event.shiftKey) dedentCurrentLine(editor);
        else insertText(editor, INDENT);
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        block.querySelector(".rust-run:not(:disabled)")?.click();
      } else if (event.key === "Escape") {
        editor.blur();
      }
    });

    block.querySelector(".rust-edit").hidden = true;
    block.querySelector(".rust-reset").hidden = false;
    autoResize(editor);
    editor.focus();
  };

  const stopEditing = (block) => {
    editorOf(block)?.remove();
    block.querySelector(".highlight").hidden = false;
    block.querySelector(".rust-edit").hidden = false;
    block.querySelector(".rust-reset").hidden = true;
  };

  document.querySelectorAll(".rust-block").forEach((block) => {
    const open = block.querySelector(".rust-open");
    const syncLink = () => (open.href = playgroundUrl(sourceOf(block)));
    syncLink();
    open.addEventListener("pointerdown", syncLink);
    open.addEventListener("focus", syncLink);

    const button = block.querySelector(".rust-run");
    button?.addEventListener("click", () => run(block, button));
    block.querySelector(".rust-edit").addEventListener("click", () => startEditing(block));
    block.querySelector(".rust-reset").addEventListener("click", () => stopEditing(block));
  });
})();
