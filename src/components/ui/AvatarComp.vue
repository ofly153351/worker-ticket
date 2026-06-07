<template>
  <span
    class="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
    :style="{ width: size + 'px', height: size + 'px', background: color, fontSize: (size * 0.38) + 'px' }"
  >{{ initials }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 30 })

const initials = computed(() =>
  props.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
)
const color = computed(() => {
  let h = 0
  for (let i = 0; i < props.name.length; i++) h = props.name.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360} 55% 45%)`
})
</script>
