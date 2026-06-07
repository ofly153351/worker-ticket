<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue >= 0 && images.length"
        class="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-sm flex flex-col animate-fadeIn"
        @click.self="$emit('update:modelValue', -1)">
        <!-- Top bar -->
        <div class="h-14 flex items-center justify-between px-5 text-white/90 shrink-0">
          <span class="text-sm font-medium">
            {{ images[modelValue]?.filename || 'Screenshot' }} · {{ modelValue + 1 }} / {{ images.length }}
          </span>
          <button @click="$emit('update:modelValue', -1)"
            class="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
            <AppIcon name="x" :size="20" />
          </button>
        </div>

        <!-- Image -->
        <div class="flex-1 flex items-center justify-center px-16 pb-8 min-h-0 relative" @click.stop>
          <button v-if="images.length > 1" @click="nav(-1)"
            class="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <AppIcon name="arrowLeft" :size="20" />
          </button>
          <img :src="images[modelValue]?.url" :alt="images[modelValue]?.filename"
            class="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl" />
          <button v-if="images.length > 1" @click="nav(1)"
            class="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
            <AppIcon name="chevronRight" :size="20" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { TicketImage } from '@/types'

const props  = defineProps<{ images: TicketImage[]; modelValue: number }>()
const emit   = defineEmits<{ 'update:modelValue': [v: number] }>()

function nav(d: number) {
  emit('update:modelValue', (props.modelValue + d + props.images.length) % props.images.length)
}

function onKey(e: KeyboardEvent) {
  if (props.modelValue < 0) return
  if (e.key === 'Escape')      emit('update:modelValue', -1)
  if (e.key === 'ArrowRight')  nav(1)
  if (e.key === 'ArrowLeft')   nav(-1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
