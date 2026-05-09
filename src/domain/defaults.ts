import type { Preset } from './types'

export const DEFAULT_ADMIN_PIN = '0000'

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'easy-10-full',
    name: 'かんたん 10秒',
    targetSeconds: 10,
    visibleUntilSeconds: 10,
    firstPrizeError: 0.3,
    secondPrizeError: 0.7,
    thirdPrizeError: 1.2,
    themeColor: '#ff5a5f',
  },
  {
    id: 'normal-10-seven',
    name: 'ふつう 10秒',
    targetSeconds: 10,
    visibleUntilSeconds: 7,
    firstPrizeError: 0.2,
    secondPrizeError: 0.5,
    thirdPrizeError: 1,
    themeColor: '#2f80ed',
  },
  {
    id: 'hard-15-three',
    name: 'むずかしい 15秒',
    targetSeconds: 15,
    visibleUntilSeconds: 3,
    firstPrizeError: 0.2,
    secondPrizeError: 0.6,
    thirdPrizeError: 1.5,
    themeColor: '#9b51e0',
  },
]
