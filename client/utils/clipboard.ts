export type CopyResult = "clipboard" | "fallback" | false

const copyWithTextarea = (text: string) => {
  const previous = document.activeElement as HTMLElement | null
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.focus()
  textarea.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
    previous?.focus()
  }
}

export const copyText = async (text: string): Promise<CopyResult> => {
  try {
    await navigator.clipboard.writeText(text)
    return "clipboard"
  } catch {
    return copyWithTextarea(text) ? "fallback" : false
  }
}
