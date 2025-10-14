function serialize(node: Node, indent = 0): string {
  const pad = '  '.repeat(indent)

  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = node.textContent?.trim() ?? ''

    return trimmed ? pad + trimmed + '\n' : ''
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    const content = node.textContent ?? ''

    return pad + '<!-- ' + content + ' -->\n'
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const attrs = Array.from(el.attributes)
    .map((a) => `${a.name}="${a.value}"`)
    .join(' ')
  const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`

  if (!el.childNodes || el.childNodes.length === 0) {
    return pad + open + `</${tag}>` + '\n'
  }

  const inner = Array.from(el.childNodes)
    .map((n) => serialize(n, indent + 1))
    .join('')

  return pad + open + '\n' + inner + pad + `</${tag}>` + '\n'
}

export function formatHtml(html: string): string {
  // Simple browser-based formatter: parse then pretty-print with indentation
  try {
    // Use DOMParser in browser environment
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      // Fallback: return original trimmed
      return html.trim()
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Serialize body children
    const out = Array.from(doc.body.childNodes)
      .map((n) => serialize(n))
      .join('')

    return out.trim()
  } catch {
    // ignore parse/format errors and return unmodified trimmed HTML
    return html.trim()
  }
}

export default formatHtml
