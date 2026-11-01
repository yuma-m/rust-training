(() => {
  const PLAYGROUND = "https://play.rust-lang.org";
  const EDITION = "2024";
  const NOISE = /^\s*(Compiling|Finished|Running|Doc-tests) /;
  const TIMEOUT_MS = 30000;

  const sourceOf = (block) => block.querySelector(".rust-source").value;

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

  document.querySelectorAll(".rust-block").forEach((block) => {
    block.querySelector(".rust-open").href = playgroundUrl(sourceOf(block));
    const button = block.querySelector(".rust-run");
    button?.addEventListener("click", () => run(block, button));
  });
})();
