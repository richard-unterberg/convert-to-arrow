<!-- 🌍 <script>function commentedOut() {}</script> -->
<template>
  <button @click="greet()">{{ identity("Vue") }}</button>
  <pre>function templateText() {}</pre>
</template>

<script lang="ts">
/** Formats a label. */
export const formatLabel = (label: string): string => {
  return label.toUpperCase()
}

export default {
  methods: {
    label() {
      return this.title
    },
  },
}
</script>

<script setup lang="ts">
const greet = (name: string = "Vue"): string => {
  return `Hello ${name}`
}

const identity = <T>(value: T): T => {
  return value
}

const initial = hoisted()
function hoisted() {
  return "ready"
}

function collectArguments() {
  return arguments.length
}

function* counter() {
  yield 1
}
</script>

<style scoped>
  button::before { content: "function styleText() {}"; }
</style>

<docs>
  <script>function customBlockText() {}</script>
</docs>
