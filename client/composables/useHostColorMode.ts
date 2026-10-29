const hostRoot = () => {
  try {
    return window.parent === window ? undefined : window.parent.document.documentElement
  } catch {
    return undefined
  }
}

export const useHostColorMode = () => {
  const dark = ref(false)
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const root = hostRoot()
  const observer = new MutationObserver(() => read())

  const read = () => {
    const classes = root?.classList
    dark.value = classes?.contains("dark") || (!classes?.contains("light") && media.matches)
  }

  onMounted(() => {
    read()
    media.addEventListener("change", read)
    if (root) observer.observe(root, { attributes: true, attributeFilter: ["class"] })
  })

  onBeforeUnmount(() => {
    media.removeEventListener("change", read)
    observer.disconnect()
  })

  watchEffect(() => document.documentElement.classList.toggle("dark", dark.value))

  return { dark }
}
