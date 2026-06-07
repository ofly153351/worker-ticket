<template>
  <div class="space-y-3">
    <!-- Drop zone -->
    <div
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
      :class="[
        'relative flex flex-col items-center justify-center text-center border-round-dashed cursor-pointer transition-colors py-9 px-6',
        dragging
          ? 'border-brand bg-slate-50 dark:bg-slate-800'
          : 'hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-800/30',
      ]"
    >
      <div class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-brand mb-3 shadow-sm">
        <AppIcon name="upload" :size="22" />
      </div>
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span class="text-brand">Click to upload</span> or drag &amp; drop
      </p>
      <p class="text-[12px] text-slate-400 mt-1">PNG, JPG or WEBP · up to 5 MB each · multiple allowed</p>
      <input ref="fileInput" type="file" :accept="ACCEPTED.join(',')" multiple class="hidden" @change="onInputChange" />
    </div>

    <!-- Previews -->
    <div v-if="previews.length">
      <div class="flex items-center justify-between mb-2">
        <span class="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
          {{ previews.length }} image{{ previews.length !== 1 ? 's' : '' }} attached
        </span>
        <button type="button" @click="clearAll" class="text-[12px] font-semibold text-slate-400 hover:text-rose-500">Clear all</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div v-for="p in previews" :key="p.id"
          class="group relative border-round overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-800">
          <img :src="p.url" :alt="p.name" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <button type="button" @click="remove(p.id)"
            class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
            <AppIcon name="trash" :size="14" />
          </button>
          <div class="absolute bottom-0 inset-x-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <p class="text-[11px] text-white font-medium truncate">{{ p.name }}</p>
            <p class="text-[10px] text-white/70">{{ fmtSize(p.size) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppIcon      from '@/components/ui/AppIcon.vue'
import { useToast } from '@/composables/useToast'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE  = 5 * 1024 * 1024

interface Preview { id: string; file: File; url: string; name: string; size: number }

const emit = defineEmits<{ 'update:modelValue': [files: File[]] }>()
const { error: toastError } = useToast()

const fileInput = ref<HTMLInputElement>()
const dragging  = ref(false)
const previews  = ref<Preview[]>([])

function addFiles(list: FileList | File[]) {
  const added: Preview[] = []
  for (const f of Array.from(list)) {
    if (!ACCEPTED.includes(f.type)) { toastError('Upload rejected', '"' + f.name + '" is not a supported image type.'); continue }
    if (f.size > MAX_SIZE)           { toastError('Upload rejected', '"' + f.name + '" exceeds 5 MB.'); continue }
    added.push({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f), name: f.name, size: f.size })
  }
  if (added.length) {
    previews.value = [...previews.value, ...added]
    emit('update:modelValue', previews.value.map(p => p.file))
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}
function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}
function remove(id: string) {
  const i = previews.value.findIndex(p => p.id === id)
  if (i >= 0) { URL.revokeObjectURL(previews.value[i].url); previews.value.splice(i, 1) }
  emit('update:modelValue', previews.value.map(p => p.file))
}
function clearAll() {
  previews.value.forEach(p => URL.revokeObjectURL(p.url))
  previews.value = []
  emit('update:modelValue', [])
}
function fmtSize(b: number) {
  return b < 1024 * 1024 ? Math.round(b / 1024) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'
}
</script>
