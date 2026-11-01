require "yaml"
require "open3"
require "tmpdir"

ITEM_RE = /\A\s*(#\[|fn |pub |struct |enum |mod |use |trait |impl |macro_rules!|type |const |static )/

def compile(src, out_dir)
  if src.include?("fn main")
    type = "bin"
  elsif src =~ ITEM_RE
    type = "lib"
  else
    src = "fn main() {\n#{src}\n}\n"
    type = "bin"
  end
  path = File.join(out_dir, "snippet.rs")
  File.write(path, src)
  _, err, status = Open3.capture3("rustc", "--edition", "2024", "--crate-type", type,
                                  "-A", "warnings", "-o", File.join(out_dir, "out"), path)
  [status.success?, err]
end

failures = 0
Dir.mktmpdir do |dir|
  ARGV.sort.each do |file|
    text = File.read(file)
    fm, body = text.match(/\A---\n(.*?)\n---\n(.*)\z/m).captures
    meta = YAML.safe_load(fm)
    name = File.basename(file)

    body.scan(/^```rust(?: (\{[^}]*\}))?\n(.*?)^```$/m).each_with_index do |(attrs, code), i|
      attrs ||= ""
      next if attrs.include?("nocheck")
      expect_fail = attrs.include?("compile-fail")
      ok, err = compile(code, dir)
      good = ok != expect_fail
      failures += 1 unless good
      puts "#{good ? 'PASS' : 'FAIL'} #{name} block##{i + 1} (expected #{expect_fail ? 'error' : 'success'})"
      puts err.lines.first(15).join unless good
    end

    (meta["quiz"] || []).each_with_index do |q, i|
      unless q["answer"].is_a?(Integer) && q["answer"].between?(0, q["choices"].size - 1)
        failures += 1
        puts "FAIL #{name} Q#{i + 1}: answer out of range"
      end
      next unless q["code"]
      ok, err = compile(q["code"], dir)
      first_err = err.lines.find { |l| l.start_with?("error") }&.strip
      puts "INFO #{name} Q#{i + 1} compiles=#{ok} answer=#{q['choices'][q['answer']]} #{first_err}"
    end
  end
end
puts failures.zero? ? "ALL OK" : "#{failures} failure(s)"
exit(failures.zero? ? 0 : 1)
