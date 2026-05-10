import { expect, test } from '@playwright/test'

const quickPreset = {
  presets: [
    {
      id: 'quick-e2e',
      name: 'E2E 0.2秒',
      targetSeconds: 0.2,
      visibleUntilSeconds: 0.2,
      firstPrizeError: 0.4,
      secondPrizeError: 0.8,
      thirdPrizeError: 1.2,
      themeColor: '#00a878',
    },
  ],
}

async function openAdmin(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByLabel('管理者メニューを開く').click({ delay: 850 })
  await page.getByLabel('PIN').fill('0000')
  await page.getByRole('button', { name: '入る' }).click()
  await expect(page.getByRole('heading', { name: '管理者メニュー' })).toBeVisible()
}

test('デフォルトプリセットが表示される', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'ぴったりストップ' })).toBeVisible()
  await expect(page.getByRole('button', { name: /かんたん 10秒/ })).toContainText('10.0秒まで見える')
  await expect(page.getByRole('button', { name: /ふつう 10秒/ })).toContainText('7.0秒まで見える')
  await expect(page.getByRole('button', { name: /むずかしい 15秒/ })).toContainText('3.0秒まで見える')
})

test('JSON追加からゲームを遊び、もう一回できる', async ({ page }) => {
  await openAdmin(page)

  await page.getByLabel('JSON入力').fill(JSON.stringify(quickPreset))
  await page.getByRole('button', { name: '読み込み' }).click()
  await expect(page.getByText('追加しました。')).toBeVisible()
  await page.getByRole('button', { name: 'プレイヤー画面' }).click()

  await page.getByRole('button', { name: /E2E 0.2秒/ }).click()
  await page.getByRole('button', { name: 'スタート' }).click()
  await page.waitForTimeout(230)
  await page.getByRole('button', { name: 'ストップ！' }).click()

  await expect(page.getByRole('heading', { name: '1等' })).toBeVisible()
  await expect(page.getByText('記録')).toBeVisible()
  await page.getByRole('button', { name: 'もう一回' }).click()
  await expect(page.getByRole('button', { name: 'スタート' })).toBeVisible()
})

test('プリセットの追加、編集、削除ができる', async ({ page }) => {
  await openAdmin(page)

  await page.getByRole('button', { name: '追加' }).click()
  await page.getByLabel('プリセット名').fill('テスト追加')
  await page.getByLabel('目標秒数').fill('1')
  await page.getByLabel('表示秒数').fill('1')
  await page.getByLabel('1等 誤差').fill('0.2')
  await page.getByLabel('2等 誤差').fill('0.5')
  await page.getByLabel('3等 誤差').fill('1')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('テスト追加')).toBeVisible()

  await page.getByLabel('テスト追加を編集').click()
  await page.getByLabel('プリセット名').fill('テスト改名')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('テスト改名')).toBeVisible()

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('テスト改名')
    await dialog.accept()
  })
  await page.getByLabel('テスト改名を削除').click()
  await expect(page.getByText('テスト改名')).toHaveCount(0)
})

test('目標秒数を変更でき、表示秒数が目標を超えると保存できない', async ({ page }) => {
  await openAdmin(page)

  await page.getByRole('button', { name: '追加' }).click()
  await page.getByLabel('プリセット名').fill('5秒チャレンジ')
  await page.getByLabel('目標秒数').fill('5')
  await page.getByLabel('表示秒数').fill('7')
  await page.getByLabel('1等 誤差').fill('0.2')
  await page.getByLabel('2等 誤差').fill('0.5')
  await page.getByLabel('3等 誤差').fill('1')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('表示秒数は目標秒数以下にしてください。')).toBeVisible()
  await expect(page.getByText('5秒チャレンジ', { exact: true })).toHaveCount(0)

  await page.getByLabel('表示秒数').fill('5')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('5秒チャレンジ')).toBeVisible()
  await expect(page.getByText('目標 5.0秒 / 表示 5.0秒')).toBeVisible()
})

test('JSON置き換えと書き出しができる', async ({ page }) => {
  await openAdmin(page)

  await page.getByLabel('JSON入力').fill(JSON.stringify(quickPreset))
  await page.getByLabel('置き換え').check()
  await page.getByRole('button', { name: '読み込み' }).click()
  await expect(page.getByText('置き換えました。')).toBeVisible()
  await expect(page.getByText('E2E 0.2秒')).toBeVisible()
  await expect(page.getByText('かんたん 10秒')).toHaveCount(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '書き出し' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('stoptimer-presets.json')
})

test('Service Worker経由でオフライン再読み込みできる', async ({ page, context }) => {
  await page.goto('/')
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const registration = await navigator.serviceWorker.ready
    return Boolean(registration.active)
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'ぴったりストップ' })).toBeVisible()
})
