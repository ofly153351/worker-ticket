<template>
  <div class="smooth-fade-up space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Summary</h1>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-brand bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full whitespace-nowrap">
            <AppIcon name="sparkle" :size="12" /> Hermes Agent
          </span>
        </div>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">AI-generated digests, refreshed every morning at 06:00.</p>
      </div>
      <AppButton variant="secondary" icon="refresh" :loading="summaryStore.generating" @click="summaryStore.generate()">
        Regenerate
      </AppButton>
    </div>

    <ErrorState v-if="summaryStore.error" :message="summaryStore.error" :on-retry="true" @retry="summaryStore.fetch()" />

    <div v-else-if="summaryStore.loading" class="space-y-5">
      <SkeletonSummaryCard v-for="i in 2" :key="i" />
    </div>

    <EmptyState v-else-if="!summaryStore.summaries.length" icon="sparkle"
      title="No summaries yet"
      body="Hermes generates a digest each morning once tickets have been filed.">
      <template #action>
        <AppButton variant="secondary" icon="refresh" @click="summaryStore.generate()">Generate now</AppButton>
      </template>
    </EmptyState>

    <div v-else class="space-y-5">
      <SummaryCard v-for="(s, i) in summaryStore.summaries" :key="s.id" :summary="s"
        class="smooth-fade-up" :style="{ animationDelay: `${i * 60}ms` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSummaryStore } from '@/stores/summary.store'
import { useProjectStore } from '@/stores/project.store'
import AppButton           from '@/components/ui/AppButton.vue'
import AppIcon             from '@/components/ui/AppIcon.vue'
import SkeletonSummaryCard from '@/components/ui/SkeletonSummaryCard.vue'
import EmptyState          from '@/components/ui/EmptyState.vue'
import ErrorState          from '@/components/ui/ErrorState.vue'
import SummaryCard         from '@/components/summaries/SummaryCard.vue'

const summaryStore = useSummaryStore()
const projectStore = useProjectStore()

onMounted(() => Promise.all([summaryStore.fetch(), projectStore.fetch()]))
</script>
