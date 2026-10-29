export const toPath = (fullName: string): (string | number)[] =>
  fullName
    .split(".")
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment))
