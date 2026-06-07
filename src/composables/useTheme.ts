import { ref, watch, readonly } from 'vue'

const _isDark = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('hermes-dark') === 'true'
    : false
)

watch(
  _isDark,
  v => {
    document.documentElement.classList.toggle('dark', v)
    localStorage.setItem('hermes-dark', String(v))
  },
  { immediate: true }
)

export function useTheme() {
  return {
    isDark: readonly(_isDark),
    toggle() { _isDark.value = !_isDark.value },
    setDark(v: boolean) { _isDark.value = v },
  }
}
