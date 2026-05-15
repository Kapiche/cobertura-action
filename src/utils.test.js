import { escapeMarkdown } from "./utils.js";

test("escapeMarkdown()", () => {
  const strings = [
    ["#1337!~", "\\#1337!\\~"],
    ["* and `stars`", "\\* and \\`stars\\`"],
    ["\\__init__.py", "\\\\\\_\\_init\\_\\_.py"],
    // Table / injection-relevant chars must be escaped:
    ["a|b.py", "a\\|b.py"],
    ["[link](x).py", "\\[link\\]\\(x\\).py"],
    ["<script>x.py", "\\<script\\>x.py"],
    // Newlines inside a cell are replaced with a space:
    ["a\nb.py", "a b.py"],
    ["a\r\nb.py", "a b.py"],
  ];

  strings.forEach((string) => {
    expect(escapeMarkdown(string[0])).toBe(string[1]);
  });
});
