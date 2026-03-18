function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function looksLikeHtml(input) {
  const s = String(input || "").trim()
  if (!s) return false
  return /<\/?[a-z][\s\S]*>/i.test(s)
}

function applyInlineMarkdown(escapedText) {
  // escapedText is already HTML-escaped. We only add a small safe subset of tags.
  let s = escapedText
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  return s
}

/**
 * Convert either HTML or Markdown/plain text into simple HTML.
 * - Backward compatible: if input already looks like HTML, return it as-is.
 * - Markdown/plain text is escaped first to prevent XSS.
 *
 * Supported Markdown:
 * - Headings: #, ##, ###
 * - Bold: **text**
 * - Italic: *text*
 * - Unordered list: - item / * item
 * - Ordered list: 1. item
 * - Paragraphs: separated by blank lines
 */
export function contentToHtml(input) {
  if (input == null) return ""
  if (looksLikeHtml(input)) return String(input)

  const raw = String(input).replace(/\r\n/g, "\n")
  const lines = raw.split("\n")

  const blocks = []
  let para = []
  let list = null // { type: "ul" | "ol", items: [] }

  const flushPara = () => {
    const linesInPara = para
      .map((s) => String(s ?? "").replace(/\s+$/g, ""))
      .filter((s) => s.length > 0)
    if (linesInPara.length) {
      const html = linesInPara
        .map((line) => applyInlineMarkdown(escapeHtml(line)))
        .join("<br />")
      blocks.push(`<p>${html}</p>`)
    }
    para = []
  }

  const flushList = () => {
    if (!list) return
    const tag = list.type
    const items = list.items
      .map((t) => `<li>${applyInlineMarkdown(escapeHtml(t.trim()))}</li>`)
      .join("")
    blocks.push(`<${tag}>${items}</${tag}>`)
    list = null
  }

  const isBlank = (s) => !s || !s.trim()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const t = line.trim()

    if (isBlank(t)) {
      flushPara()
      flushList()
      // Preserve blank lines exactly as entered
      blocks.push("<br />")
      continue
    }

    // Headings
    const mdHeading = /^(#{1,3})\s+(.*)$/.exec(t)
    if (mdHeading) {
      flushPara()
      flushList()
      const level = mdHeading[1].length
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3"
      blocks.push(`<${tag}>${applyInlineMarkdown(escapeHtml(mdHeading[2] || ""))}</${tag}>`)
      continue
    }

    // Unordered list
    const ul = /^[-*]\s+(.*)$/.exec(t)
    if (ul) {
      flushPara()
      if (!list || list.type !== "ul") {
        flushList()
        list = { type: "ul", items: [] }
      }
      list.items.push(ul[1] || "")
      continue
    }

    // Ordered list
    const ol = /^\d+\.\s+(.*)$/.exec(t)
    if (ol) {
      flushPara()
      if (!list || list.type !== "ol") {
        flushList()
        list = { type: "ol", items: [] }
      }
      list.items.push(ol[1] || "")
      continue
    }

    // Normal text line
    flushList()
    // Keep original line (without trailing spaces) so line breaks match the DB
    para.push(line.replace(/\s+$/g, ""))
  }

  flushPara()
  flushList()

  // Avoid leading/trailing blank lines rendering odd spacing
  return blocks.join("").replace(/^(<br \/>)+/, "").replace(/(<br \/>)+$/, "")
}

