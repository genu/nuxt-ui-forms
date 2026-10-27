const isRootAttr = (key: string) =>
  key === "class" || key === "style" || key === "id" || key.startsWith("data-") || key.startsWith("aria-")

export const pickRootAttrs = (attrs: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => isRootAttr(key)))
