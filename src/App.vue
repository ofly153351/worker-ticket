<template>
  <!-- Dark-mode wrapper: toggling 'dark' class here applies Tailwind dark: variants everywhere. -->
  <div :class="isDark ? 'dark' : ''" class="contents">
    <AppLayout>
      <RouterView />
    </AppLayout>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppToast  from '@/components/ui/AppToast.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>
