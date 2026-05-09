import { DEFAULT_ADMIN_PIN, DEFAULT_PRESETS } from './defaults'
import { normalizePreset } from './presets'
import type { Preset } from './types'

const PRESETS_KEY = 'stoptimer.presets.v1'
const ADMIN_PIN_KEY = 'stoptimer.adminPin.v1'

export function loadPresets(): Preset[] {
  const raw = localStorage.getItem(PRESETS_KEY)
  if (!raw) return DEFAULT_PRESETS

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return DEFAULT_PRESETS
    return parsed.map((item) => normalizePreset(item))
  } catch {
    return DEFAULT_PRESETS
  }
}

export function savePresets(presets: Preset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

export function loadAdminPin() {
  return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_ADMIN_PIN
}

export function saveAdminPin(pin: string) {
  localStorage.setItem(ADMIN_PIN_KEY, pin)
}

export function resetLocalData() {
  localStorage.removeItem(PRESETS_KEY)
  localStorage.removeItem(ADMIN_PIN_KEY)
}
