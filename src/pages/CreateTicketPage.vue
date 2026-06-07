<template>
  <div class="smooth-fade-up">
    <RouterLink to="/tickets" class="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 mb-4">
      <AppIcon name="arrowLeft" :size="15" /> Back to tickets
    </RouterLink>

    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Report a bug</h1>
      <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Give us enough to reproduce it. The more context, the faster the fix.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Main -->
      <div class="lg:col-span-2 space-y-5">
        <AppCard class="space-y-5">
          <!-- Project -->
          <FieldWrapper label="Project" required :error="errors.projectId">
            <div class="relative">
              <select v-model="form.projectId" class="full-select" :class="errors.projectId ? 'border-rose-400' : ''">
                <option value="">Select a project…</option>
                <option v-for="p in projectStore.activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <AppIcon name="chevronDown" :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </FieldWrapper>

          <!-- Title -->
          <FieldWrapper label="Bug title" required :hint="form.title.length + '/120'" :error="errors.title">
            <input v-model="form.title" maxlength="120" placeholder="e.g. Payment button unresponsive on second attempt"
              class="field-input" :class="errors.title ? 'border-rose-400' : ''" />
          </FieldWrapper>

          <!-- Description -->
          <FieldWrapper label="Description" required hint="Steps, expected vs actual" :error="errors.description">
            <textarea v-model="form.description" rows="5" placeholder="What did you do? What did you expect? What happened instead?"
              class="field-input h-auto py-3 resize-y leading-relaxed" :class="errors.description ? 'border-rose-400' : ''" />
          </FieldWrapper>

          <!-- Severity -->
          <FieldWrapper label="Severity" required :error="errors.severity">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button v-for="s in SEVERITIES" :key="s" type="button" @click="form.severity = s"
                :class="['h-11 rounded-btn border text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                  form.severity === s
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300']"
                :style="form.severity === s ? { background: SEVERITY_META[s].dot } : {}">
                <span class="w-2 h-2 rounded-full" :style="{ background: form.severity === s ? '#fff' : SEVERITY_META[s].dot }" />
                {{ SEVERITY_META[s].label }}
              </button>
            </div>
          </FieldWrapper>
        </AppCard>

        <!-- Image uploader -->
        <AppCard class="space-y-3">
          <FieldWrapper label="Screenshots" hint="Optional but recommended">
            <ImageUploader v-model="images" />
          </FieldWrapper>
        </AppCard>
      </div>

      <!-- Sidebar -->
      <div class="space-y-5 lg:sticky lg:top-6">
        <AppCard class="space-y-5">
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AppIcon name="user" :size="16" class="text-slate-400" /> Reporter & context
          </h3>
          <FieldWrapper label="Reporter name" required :error="errors.reporterName">
            <input v-model="form.reporterName" class="field-input" :class="errors.reporterName ? 'border-rose-400' : ''" />
          </FieldWrapper>
          <FieldWrapper label="Page URL" hint="Where it happened">
            <input v-model="form.pageUrl" placeholder="https://app.example.com/…" class="field-input" />
          </FieldWrapper>
          <FieldWrapper label="Browser info" hint="Auto-detected">
            <div class="flex items-start gap-2.5 rounded-btn bg-slate-100 dark:bg-slate-800 px-3.5 py-3 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <AppIcon name="monitor" :size="15" class="mt-0.5 shrink-0 text-slate-400" />
              <span class="break-all font-mono">{{ browserInfo }}</span>
            </div>
          </FieldWrapper>
        </AppCard>

        <AppCard class="bg-slate-50/80 dark:bg-slate-800/40 border-dashed">
          <div class="flex gap-2.5">
            <AppIcon name="sparkle" :size="16" class="text-brand mt-0.5 shrink-0" />
            <p class="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Hermes will auto-tag this ticket and fold it into tonight's project digest.
            </p>
          </div>
        </AppCard>

        <div class="flex flex-col gap-2.5">
          <AppButton type="submit" size="lg" :loading="submitting" :disabled="submitting" class="w-full" icon="check">
            Create ticket
          </AppButton>
          <RouterLink to="/tickets">
            <AppButton type="button" variant="ghost" :disabled="submitting" class="w-full">Cancel</AppButton>
          </RouterLink>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useTicketStore }  from '@/stores/ticket.store'
import { useProjectStore } from '@/stores/project.store'
import { useToast }        from '@/composables/useToast'
import { SEVERITY_META, SEVERITIES } from '@/constants'
import AppCard      from '@/components/ui/AppCard.vue'
import AppButton    from '@/components/ui/AppButton.vue'
import AppIcon      from '@/components/ui/AppIcon.vue'
import FieldWrapper from '@/components/ui/FieldWrapper.vue'
import ImageUploader from '@/components/tickets/ImageUploader.vue'
import type { Severity } from '@/types'

const ticketStore  = useTicketStore()
const projectStore = useProjectStore()
const { success: toastSuccess, error: toastError } = useToast()
const router = useRouter()

onMounted(() => projectStore.fetch())

const browserInfo = navigator.userAgent
const submitting  = ref(false)
const images      = ref<File[]>([])

const form = reactive({
  projectId:    '',
  title:        '',
  description:  '',
  severity:     '' as Severity | '',
  reporterName: '',
  pageUrl:      '',
})

const errors = reactive<Record<string, string>>({})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.projectId)          errors.projectId    = 'Please choose a project.'
  if (!form.title.trim())       errors.title        = 'A short title is required.'
  else if (form.title.length < 6) errors.title      = 'Title is a little short — add more detail.'
  if (!form.description.trim()) errors.description  = 'Describe what went wrong.'
  if (!form.severity)           errors.severity     = 'Pick a severity level.'
  if (!form.reporterName.trim()) errors.reporterName = 'Your name is required.'
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validate()) { toastError('Check the form', 'Some required fields need attention.'); return }
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('project_id',   form.projectId)
    fd.append('title',        form.title.trim())
    fd.append('description',  form.description.trim())
    fd.append('severity',     form.severity)
    fd.append('reporter_name', form.reporterName.trim())
    fd.append('page_url',     form.pageUrl)
    fd.append('browser_info', browserInfo)
    images.value.forEach(f => fd.append('images', f))
    const ticket = await ticketStore.create(fd)
    toastSuccess('Ticket created', ticket.id + ' has been filed and the team notified.')
    router.push('/tickets/' + ticket.id)
  } catch {
    toastError('Failed to create ticket', 'Check your connection and try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.field-input {
  @apply w-full h-11 px-3.5 rounded-btn border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-colors focus:border-brand;
}
.full-select {
  @apply appearance-none w-full h-11 pl-3.5 pr-10 rounded-btn border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-brand cursor-pointer;
}
</style>
