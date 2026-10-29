import { defineComponent, h, type Component, type PropType } from "vue"
import { provideNameScope } from "./name-scope"

export const createScopedIteration = (name: () => string, Iteration: Component): Component =>
  defineComponent({
    name: "ScopedIteration",
    props: {
      index: { type: Number, required: true },
      as: { type: String as PropType<string>, default: undefined },
    },
    setup(props, { slots }) {
      provideNameScope(() => `${name()}.${props.index}`)

      return () => h(Iteration, { index: props.index, as: props.as }, slots)
    },
  })
