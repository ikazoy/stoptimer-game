import type { Preset, PrizeRank } from './types'

export function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function toSecondsLabel(value: number) {
  return `${value.toFixed(1)}秒`
}

export function judgePrize(
  absoluteError: number,
  preset: Pick<
    Preset,
    'firstPrizeError' | 'secondPrizeError' | 'thirdPrizeError'
  >,
): PrizeRank {
  if (absoluteError <= preset.firstPrizeError) return 'first'
  if (absoluteError <= preset.secondPrizeError) return 'second'
  return 'third'
}

export function prizeLabel(rank: PrizeRank) {
  if (rank === 'first') return '1等'
  if (rank === 'second') return '2等'
  return '3等'
}

export function validatePreset(preset: Preset) {
  const errors: string[] = []

  if (!preset.name.trim()) errors.push('名前を入力してください。')
  if (!Number.isFinite(preset.targetSeconds) || preset.targetSeconds <= 0) {
    errors.push('目標秒数は0より大きい数にしてください。')
  }
  if (
    !Number.isFinite(preset.visibleUntilSeconds) ||
    preset.visibleUntilSeconds < 0
  ) {
    errors.push('表示秒数は0以上にしてください。')
  }
  if (preset.visibleUntilSeconds > preset.targetSeconds) {
    errors.push('表示秒数は目標秒数以下にしてください。')
  }
  if (preset.firstPrizeError < 0) errors.push('1等の誤差は0以上にしてください。')
  if (preset.secondPrizeError < 0) errors.push('2等の誤差は0以上にしてください。')
  if (preset.thirdPrizeError < 0) errors.push('3等の誤差は0以上にしてください。')
  if (preset.firstPrizeError > preset.secondPrizeError) {
    errors.push('1等の誤差は2等以下にしてください。')
  }
  if (preset.secondPrizeError > preset.thirdPrizeError) {
    errors.push('2等の誤差は3等以下にしてください。')
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(preset.themeColor)) {
    errors.push('テーマカラーは #RRGGBB 形式にしてください。')
  }

  return errors
}

function numberFromUnknown(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function normalizePreset(raw: unknown): Preset {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const preset: Preset = {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : makeId(),
    name: typeof value.name === 'string' ? value.name.trim() : '',
    targetSeconds: numberFromUnknown(value.targetSeconds, 10),
    visibleUntilSeconds: numberFromUnknown(value.visibleUntilSeconds, 5),
    firstPrizeError: numberFromUnknown(value.firstPrizeError, 0.2),
    secondPrizeError: numberFromUnknown(value.secondPrizeError, 0.5),
    thirdPrizeError: numberFromUnknown(value.thirdPrizeError, 1),
    themeColor:
      typeof value.themeColor === 'string' && value.themeColor.trim()
        ? value.themeColor.trim()
        : '#2f80ed',
  }

  const errors = validatePreset(preset)
  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  return preset
}

export function parsePresetJson(text: string): Preset[] {
  const parsed = JSON.parse(text) as unknown
  const rawPresets = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { presets?: unknown }).presets)
      ? (parsed as { presets: unknown[] }).presets
      : null

  if (!rawPresets) {
    throw new Error('JSONはプリセット配列、または { "presets": [...] } にしてください。')
  }

  if (rawPresets.length === 0) {
    throw new Error('プリセットが1件もありません。')
  }

  return rawPresets.map((item) => normalizePreset(item))
}
