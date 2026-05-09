export type PrizeRank = 'first' | 'second' | 'third'

export type Preset = {
  id: string
  name: string
  targetSeconds: number
  visibleUntilSeconds: number
  firstPrizeError: number
  secondPrizeError: number
  thirdPrizeError: number
  themeColor: string
}

export type GameResult = {
  preset: Preset
  elapsedSeconds: number
  diffSeconds: number
  absoluteError: number
  rank: PrizeRank
}

export type ImportMode = 'append' | 'replace'
