import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectApi } from '@/services/project.api'
import type { Project } from '@/types'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading  = ref(false)
  const error    = ref<string | null>(null)

  const activeProjects = computed(() => projects.value.filter(p => p.status === 'Active'))

  async function fetch() {
    loading.value = true
    error.value   = null
    try {
      projects.value = await projectApi.list()
    } catch {
      error.value = 'Could not load projects. Check your API connection.'
    } finally {
      loading.value = false
    }
  }

  function getById(id: string) {
    return projects.value.find(p => p.id === id) ?? null
  }

  return { projects, activeProjects, loading, error, fetch, getById }
})
