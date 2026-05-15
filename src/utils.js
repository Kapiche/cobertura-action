export function escapeMarkdown(string) {
  return string.replace(/([*_`~#\\])/g, "\\$1");
}
