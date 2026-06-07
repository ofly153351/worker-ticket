<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
    :style="badgeStyle"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: m.dot }" />
    {{ m.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_META } from '@/constants'
import { useTheme } from '@/composables/useTheme'
import type { TicketStatus } from '@/types'

const props = defineProps<{ status: TicketStatus }>()
const { isDark } = useTheme()
const m = computed(() => STATUS_META[props.status] ?? STATUS_META.open)
const badgeStyle = computed(() => ({
  background: isDark.value ? m.value.bgDark : m.value.bg,
  color:      isDark.value ? m.value.textDark : m.value.text,
}))
</script>
