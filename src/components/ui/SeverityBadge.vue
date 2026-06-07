<template>
  <span
    v-if="dotOnly"
    class="inline-block w-2 h-2 rounded-full"
    :style="{ background: m.dot }"
    :title="m.label"
  />
  <span
    v-else
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
    :style="badgeStyle"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: m.dot }" />
    {{ m.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SEVERITY_META } from '@/constants'
import { useTheme } from '@/composables/useTheme'
import type { Severity } from '@/types'

const props = withDefaults(defineProps<{ severity: Severity; dotOnly?: boolean }>(), { dotOnly: false })
const { isDark } = useTheme()
const m = computed(() => SEVERITY_META[props.severity] ?? SEVERITY_META.low)
const badgeStyle = computed(() => ({
  background: isDark.value ? m.value.bgDark : m.value.bg,
  color:      isDark.value ? m.value.textDark : m.value.text,
}))
</script>
