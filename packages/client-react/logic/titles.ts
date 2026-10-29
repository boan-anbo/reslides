/** Read authored HTML titles as plain text in navigation controls. */
export function titleText(title: unknown, fallback: string): string {
  if (typeof title !== 'string' || !title) return fallback
  const template = document.createElement('template')
  template.innerHTML = title.replace(/<br\s*\/?\s*>/gi, ' ')
  return template.content.textContent?.trim() || fallback
}
