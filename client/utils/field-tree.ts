import type { FieldSnapshot } from "../../src/runtime/devtools/snapshot"

export interface FieldTreeNode {
  key: string
  path: string
  field?: FieldSnapshot
  children: FieldTreeNode[]
}

const compareKeys = (a: FieldTreeNode, b: FieldTreeNode) => a.key.localeCompare(b.key, "en", { numeric: true })

const sortTree = (nodes: FieldTreeNode[]): FieldTreeNode[] => {
  nodes.sort(compareKeys).forEach((node) => sortTree(node.children))
  return nodes
}

export const buildFieldTree = (fields: FieldSnapshot[]): FieldTreeNode[] => {
  const roots: FieldTreeNode[] = []
  const nodes = new Map<string, FieldTreeNode>()

  for (const field of fields) {
    let siblings = roots
    let path = ""
    let node: FieldTreeNode | undefined
    for (const key of field.path.split(".")) {
      path = path ? `${path}.${key}` : key
      node = nodes.get(path)
      if (!node) {
        node = { key, path, children: [] }
        nodes.set(path, node)
        siblings.push(node)
      }
      siblings = node.children
    }
    node!.field = field
  }

  return sortTree(roots)
}
