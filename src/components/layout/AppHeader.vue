<template>
  <header class="h-16 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-30">
    <button @click="$emit('toggleSidebar')" class="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
      <AppIcon name="menu" :size="20" />
    </button>

    <div class="hidden sm:block min-w-0"><AppBreadcrumb /></div>
    <div class="flex-1" />

    <!-- Search -->
    <div class="relative hidden md:block w-64">
      <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        v-model="q"
        placeholder="Search tickets…"
        @keydown.enter="doSearch"
        class="w-full h-9 pl-9 pr-3 rounded-btn bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand focus:bg-white dark:focus:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-colors"
      />
    </div>

    <button @click="themeToggle" :title="isDark ? 'Light mode' : 'Dark mode'"
      class="p-2 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
      <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
    </button>

    <button class="relative p-2 text-slate-500 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
      <AppIcon name="bell" :size="18" />
      <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
    </button>

    <RouterLink to="/tickets/create" class="hidden sm:inline-flex">
      <AppButton size="sm" icon="plus">New Ticket</AppButton>
    </RouterLink>

    <div class="w-px h-7 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
    <AvatarComp name="Maya Tran" :size="32" />
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import AppIcon        from '@/components/ui/AppIcon.vue'
import AppButton      from '@/components/ui/AppButton.vue'
import AvatarComp     from '@/components/ui/AvatarComp.vue'
import AppBreadcrumb  from './AppBreadcrumb.vue'

defineEmits<{ toggleSidebar: [] }>()

const router = useRouter()
const { isDark, toggle: themeToggle } = useTheme()

const q = ref('')
function doSearch() {
  if (q.value.trim()) router.push({ path: '/tickets', query: { q: q.value.trim() } })
}
</script>
