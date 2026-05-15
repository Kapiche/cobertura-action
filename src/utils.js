// Markdown characters that need escaping inside a table cell. Limited to
// the set that (a) breaks the table itself, (b) enables link/HTML
// injection, or (c) was already escaped by previous versions of this
// function. `.`, `!`, `+`, `-` etc. are not included because they only have
// markdown meaning at line-start, which can't happen inside a cell.
const MARKDOWN_SPECIAL = /([\\`*_~#<>|[\]()])/g;

export function escapeMarkdown(string) {
  // Newlines in a table cell break the whole row, so collapse them rather
  // than escape them.
  return string.replace(/\r?\n/g, " ").replace(MARKDOWN_SPECIAL, "\\$1");
}
