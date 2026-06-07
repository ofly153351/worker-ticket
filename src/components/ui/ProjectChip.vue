<template>
  <span class="inline-flex items-center gap-2 min-w-0">
    <span
      class="inline-flex items-center justify-center rounded-lg text-white text-[10px] font-bold shrink-0"
      :style="{ width: '22px', height: '22px', background: project.color }"
    >{{ project.code }}</span>
    <span v-if="showName" class="truncate text-slate-700 dark:text-slate-200 text-sm">{{ project.name }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project.store'

const props = withDefaults(defineProps<{ projectId: string; showName?: boolean }>(), { showName: true })
const store   = useProjectStore()
const project = computed(() => store.getById(props.projectId) ?? { code: '?', color: '#94a3b8', name: props.projectId })
</script>
