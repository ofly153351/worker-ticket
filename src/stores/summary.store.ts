import { defineStore } from 'pinia'
import { ref } from 'vue'
import { summaryApi } from '@/services/summary.api'
import type { DailySummary } from '@/types'

export const useSummaryStore = defineStore('summaries', () => {
  const summaries  = ref<DailySummary[]>([])
  const loading    = ref(false)
  const generating = ref(false)
  const error      = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value   = null
    try {
      summaries.value = await summaryApi.list()
    } catch {
      error.value = 'Could not load summaries.'
    } finally {
      loading.value = false
    }
  }

  async function generate(projectId?: string) {
    generating.value = true
    try {
      await summaryApi.generate(projectId)
      await fetch()
    } catch {
      error.value = 'Failed to generate summary.'
    } finally {
      generating.value = false
    }
  }

  return { summaries, loading, generating, error, fetch, generate }
})
