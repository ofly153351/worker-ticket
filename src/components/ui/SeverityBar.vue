<template>
  <div class="flex w-full overflow-hidden rounded-full" :style="{ height: height + 'px' }">
    <div
      v-for="k in ORDER"
      :key="k"
      v-show="counts[k]"
      :style="{ width: pct(k) + '%', background: SEVERITY_META[k].dot }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SEVERITY_META } from '@/constants'
import type { Severity } from '@/types'

const props = withDefaults(defineProps<{
  counts: Record<Severity, number>
  height?: number
}>(), { height: 8 })

const ORDER: Severity[] = ['critical', 'high', 'medium', 'low']
const total  = computed(() => Object.values(props.counts).reduce((a, b) => a + b, 0) || 1)
const pct    = (k: Severity) => (props.counts[k] / total.value) * 100
</script>
