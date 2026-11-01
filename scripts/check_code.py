# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6"]
# ///
"""Compile-check Rust snippets in chapter Markdown files and validate quiz data."""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

FRONT_MATTER_RE = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.S)
CODE_BLOCK_RE = re.compile(r"^```rust(?: (\{[^}]*\}))?\n(.*?)^```$", re.M | re.S)
ITEM_RE = re.compile(
    r"\A\s*(#\[|fn |pub |struct |enum |mod |use |trait |impl |macro_rules!|type |const |static )"
)


def compile_snippet(src: str, out_dir: Path) -> tuple[bool, str]:
    if "fn main" in src:
        crate_type = "bin"
    elif ITEM_RE.match(src):
        crate_type = "lib"
    else:
        src = f"fn main() {{\n{src}\n}}\n"
        crate_type = "bin"

    path = out_dir / "snippet.rs"
    path.write_text(src)
    result = subprocess.run(
        ["rustc", "--edition", "2024", "--crate-type", crate_type,
         "-A", "warnings", "-o", str(out_dir / "out"), str(path)],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0, result.stderr


def check_file(file: Path, out_dir: Path) -> int:
    match = FRONT_MATTER_RE.match(file.read_text())
    if not match:
        print(f"FAIL {file.name}: front matter not found")
        return 1
    meta = yaml.safe_load(match.group(1)) or {}
    body = match.group(2)
    failures = 0

    for i, (attrs, code) in enumerate(CODE_BLOCK_RE.findall(body), start=1):
        if "nocheck" in attrs:
            continue
        expect_fail = "compile-fail" in attrs
        ok, err = compile_snippet(code, out_dir)
        good = ok != expect_fail
        expected = "error" if expect_fail else "success"
        print(f"{'PASS' if good else 'FAIL'} {file.name} block#{i} (expected {expected})")
        if not good:
            failures += 1
            print("".join(err.splitlines(keepends=True)[:15]))

    for i, q in enumerate(meta.get("quiz") or [], start=1):
        answer, choices = q.get("answer"), q.get("choices") or []
        if not isinstance(answer, int) or not 0 <= answer < len(choices):
            failures += 1
            print(f"FAIL {file.name} Q{i}: answer out of range")
            continue
        if code := q.get("code"):
            ok, err = compile_snippet(code, out_dir)
            first_err = next((l.strip() for l in err.splitlines() if l.startswith("error")), "")
            print(f"INFO {file.name} Q{i} compiles={ok} answer={choices[answer]} {first_err}")

    return failures


def main() -> int:
    files = sorted(Path(p) for p in sys.argv[1:])
    if not files:
        print("usage: uv run scripts/check_code.py content/docs/[0-9]*.md", file=sys.stderr)
        return 2

    with tempfile.TemporaryDirectory() as tmp:
        failures = sum(check_file(f, Path(tmp)) for f in files)

    print("ALL OK" if failures == 0 else f"{failures} failure(s)")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
