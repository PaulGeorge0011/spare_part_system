<script setup lang="ts">
import { useMessage, useDialog } from 'naive-ui'

const message = useMessage()
const dialog = useDialog()

window.$message = message
window.$dialog = dialog
</script>

<template>
  <slot />
</template>
