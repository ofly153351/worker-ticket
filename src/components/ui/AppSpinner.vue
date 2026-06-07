<template>
  <span
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 18 })
</script>
