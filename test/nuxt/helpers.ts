import { flushPromises, type VueWrapper } from "@vue/test-utils"

export const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 50))
  await flushPromises()
}

export const errorOf = (wrapper: VueWrapper, field: string) => {
  const error = wrapper.find(`[data-testid="${field}"] [data-slot="error"]`)
  return error.exists() ? error.text() : undefined
}

export const textOf = (wrapper: VueWrapper, testId: string) => wrapper.get(`[data-testid="${testId}"]`).text()

export const interact = async (wrapper: VueWrapper, input: string, value: string) => {
  const element = wrapper.get(`[data-testid="${input}"]`)
  await element.trigger("focus")
  await element.setValue(value)
  await element.trigger("blur")
  await settle()
}
