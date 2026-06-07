import { ref, computed, onMounted, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'

/**
 * Shared 1-second ticker — a single setInterval drives every countdown
 * instance on the page, so adding more countdowns costs nothing extra.
 */
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let refCount = 0

function startTicker() {
  if (timer) return
  timer = setInterval(() => { now.value = Date.now() }, 1000)
}
function stopTicker() {
  if (timer && refCount <= 0) { clearInterval(timer); timer = null }
}

/**
 * Counts down to a target time entirely client-side.
 * `target` may be a Date, ISO string, ref, or getter — null/undefined = no target.
 */
export function useCountdown(target: MaybeRefOrGetter<Date | string | null | undefined>) {
  onMounted(() => { refCount++; startTicker() })
  onUnmounted(() => { refCount--; stopTicker() })

  const remainingMs = computed(() => {
    const t = toValue(target)
    if (!t) return null
    const ms = new Date(t).getTime() - now.value
    return ms > 0 ? ms : 0
  })

  const parts = computed(() => {
    const ms = remainingMs.value
    if (ms == null) return null
    const totalSec = Math.floor(ms / 1000)
    return {
      days:    Math.floor(totalSec / 86400),
      hours:   Math.floor(totalSec / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
    }
  })

  /** Compact human label, e.g. "5h 23m", "2d 4h", "45s", "now" */
  const label = computed(() => {
    const p = parts.value
    if (!p) return '—'
    if (p.hours === 0 && p.minutes === 0 && p.seconds === 0) return 'now'
    if (p.days >= 1)     return `${p.days}d ${p.hours % 24}h`
    if (p.hours >= 1)    return `${p.hours}h ${p.minutes}m`
    if (p.minutes >= 1)  return `${p.minutes}m ${p.seconds}s`
    return `${p.seconds}s`
  })

  /** Padded clock label HH:MM:SS (caps days into hours) */
  const clock = computed(() => {
    const p = parts.value
    if (!p) return '--:--:--'
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(p.hours)}:${pad(p.minutes)}:${pad(p.seconds)}`
  })

  const expired = computed(() => remainingMs.value === 0)

  return { remainingMs, parts, label, clock, expired }
}
