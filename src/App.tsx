import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Download,
  FileJson,
  Home,
  KeyRound,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Timer,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'
import { DEFAULT_PRESETS } from './domain/defaults'
import {
  judgePrize,
  makeId,
  parsePresetJson,
  prizeLabel,
  toSecondsLabel,
  validatePreset,
} from './domain/presets'
import { playTone } from './domain/sound'
import {
  loadAdminPin,
  loadPresets,
  resetLocalData,
  saveAdminPin,
  savePresets,
} from './domain/storage'
import type { GameResult, ImportMode, Preset } from './domain/types'

type View =
  | { name: 'home' }
  | { name: 'pin' }
  | { name: 'admin' }
  | { name: 'game'; preset: Preset }
  | { name: 'result'; result: GameResult }

const emptyPreset: Preset = {
  id: '',
  name: '',
  targetSeconds: 10,
  visibleUntilSeconds: 5,
  firstPrizeError: 0.2,
  secondPrizeError: 0.5,
  thirdPrizeError: 1,
  themeColor: '#2f80ed',
}

function App() {
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  const [adminPin, setAdminPin] = useState(() => loadAdminPin())
  const [view, setView] = useState<View>({ name: 'home' })

  function updatePresets(nextPresets: Preset[]) {
    setPresets(nextPresets)
    savePresets(nextPresets)
  }

  function updateAdminPin(nextPin: string) {
    setAdminPin(nextPin)
    saveAdminPin(nextPin)
  }

  function showResult(preset: Preset, elapsedSeconds: number) {
    const diffSeconds = elapsedSeconds - preset.targetSeconds
    const absoluteError = Math.abs(diffSeconds)
    const result: GameResult = {
      preset,
      elapsedSeconds,
      diffSeconds,
      absoluteError,
      rank: judgePrize(absoluteError, preset),
    }
    setView({ name: 'result', result })
    playTone('win')
  }

  return (
    <main className="app-shell">
      <PortraitNotice />
      {view.name === 'home' && (
        <HomeScreen
          presets={presets}
          onSelect={(preset) => setView({ name: 'game', preset })}
          onAdmin={() => setView({ name: 'pin' })}
        />
      )}
      {view.name === 'pin' && (
        <PinScreen
          adminPin={adminPin}
          onCancel={() => setView({ name: 'home' })}
          onSuccess={() => setView({ name: 'admin' })}
        />
      )}
      {view.name === 'admin' && (
        <AdminScreen
          presets={presets}
          adminPin={adminPin}
          onBack={() => setView({ name: 'home' })}
          onChangePin={updateAdminPin}
          onChangePresets={updatePresets}
        />
      )}
      {view.name === 'game' && (
        <GameScreen
          preset={view.preset}
          onBack={() => setView({ name: 'home' })}
          onFinish={(elapsedSeconds) => showResult(view.preset, elapsedSeconds)}
        />
      )}
      {view.name === 'result' && (
        <ResultScreen
          result={view.result}
          onRetry={() => setView({ name: 'game', preset: view.result.preset })}
          onHome={() => setView({ name: 'home' })}
        />
      )}
    </main>
  )
}

function PortraitNotice() {
  return (
    <aside className="portrait-notice" aria-live="polite">
      <Timer size={64} />
      <h1>iPadを横向きにしてね</h1>
    </aside>
  )
}

function HomeScreen({
  presets,
  onSelect,
  onAdmin,
}: {
  presets: Preset[]
  onSelect: (preset: Preset) => void
  onAdmin: () => void
}) {
  const holdTimer = useRef<number | null>(null)

  function startHold() {
    clearHold()
    holdTimer.current = window.setTimeout(onAdmin, 750)
  }

  function clearHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  return (
    <section className="home-screen">
      <header className="top-bar">
        <div>
          <p className="eyebrow">お祭りブース</p>
          <h1>ぴったりストップ</h1>
        </div>
        <button
          className="icon-button admin-gear"
          type="button"
          aria-label="管理者メニューを開く"
          title="管理者メニュー"
          onPointerDown={startHold}
          onPointerUp={clearHold}
          onPointerCancel={clearHold}
          onPointerLeave={clearHold}
        >
          <Settings />
        </button>
      </header>

      <div className="preset-grid" aria-label="プリセット一覧">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className="preset-card"
            type="button"
            style={{ '--accent-color': preset.themeColor } as React.CSSProperties}
            onClick={() => onSelect(preset)}
          >
            <span className="preset-card__name">{preset.name}</span>
            <span className="preset-card__target">
              <Timer size={36} />
              {toSecondsLabel(preset.targetSeconds)}
            </span>
            <span className="preset-card__rule">
              {toSecondsLabel(preset.visibleUntilSeconds)}まで見える
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function PinScreen({
  adminPin,
  onCancel,
  onSuccess,
}: {
  adminPin: string
  onCancel: () => void
  onSuccess: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pin === adminPin) {
      onSuccess()
      return
    }
    setError('PINが違います。')
  }

  return (
    <section className="panel-screen compact-screen">
      <form className="panel auth-panel" onSubmit={submit}>
        <KeyRound size={52} />
        <h1>管理者PIN</h1>
        <label>
          PIN
          <input
            autoFocus
            inputMode="numeric"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onCancel}>
            <ArrowLeft />
            戻る
          </button>
          <button className="primary-button" type="submit">
            <KeyRound />
            入る
          </button>
        </div>
      </form>
    </section>
  )
}

function GameScreen({
  preset,
  onBack,
  onFinish,
}: {
  preset: Preset
  onBack: () => void
  onFinish: (elapsedSeconds: number) => void
}) {
  const [phase, setPhase] = useState<'ready' | 'running'>('ready')
  const [elapsed, setElapsed] = useState(0)
  const startAt = useRef(0)

  useEffect(() => {
    if (phase !== 'running') return
    let frame = 0
    const tick = () => {
      setElapsed((performance.now() - startAt.current) / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  function start() {
    playTone('start')
    startAt.current = performance.now()
    setElapsed(0)
    setPhase('running')
  }

  function stop() {
    const finalElapsed = (performance.now() - startAt.current) / 1000
    playTone('stop')
    onFinish(finalElapsed)
  }

  const shouldHide = phase === 'running' && elapsed > preset.visibleUntilSeconds
  const displayTime = phase === 'ready' ? 0 : elapsed

  return (
    <section
      className="game-screen"
      style={{ '--accent-color': preset.themeColor } as React.CSSProperties}
    >
      <header className="game-header">
        <button className="icon-button" type="button" aria-label="メニューへ" onClick={onBack}>
          <Home />
        </button>
        <div>
          <p className="eyebrow">{preset.name}</p>
          <h1>{toSecondsLabel(preset.targetSeconds)}で止めよう</h1>
        </div>
        {phase === 'ready' ? (
          <div className="target-pill">
            表示 {toSecondsLabel(preset.visibleUntilSeconds)}まで
          </div>
        ) : (
          <div className="target-pill-placeholder" aria-hidden="true" />
        )}
      </header>

      <div
        className={`timer-display ${shouldHide ? 'is-hidden' : ''}`}
        aria-label={shouldHide ? 'タイマーは隠れています' : `経過 ${displayTime.toFixed(1)}秒`}
        aria-live="polite"
      >
        <span className="timer-value">{displayTime.toFixed(1)}</span>
        {shouldHide && <span className="timer-cover">???</span>}
      </div>

      {phase === 'ready' ? (
        <button className="start-button" type="button" onClick={start}>
          <Play />
          スタート
        </button>
      ) : (
        <button className="stop-button" type="button" onClick={stop}>
          ストップ！
        </button>
      )}
    </section>
  )
}

function ResultScreen({
  result,
  onRetry,
  onHome,
}: {
  result: GameResult
  onRetry: () => void
  onHome: () => void
}) {
  const direction = result.diffSeconds < 0 ? 'はやい' : 'おそい'

  return (
    <section
      className={`result-screen result-${result.rank}`}
      style={{ '--accent-color': result.preset.themeColor } as React.CSSProperties}
    >
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 22 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <p className="eyebrow">結果発表</p>
      <h1>{prizeLabel(result.rank)}</h1>
      <div className="result-numbers">
        <div>
          <span>記録</span>
          <strong>{toSecondsLabel(result.elapsedSeconds)}</strong>
        </div>
        <div>
          <span>差</span>
          <strong>
            {toSecondsLabel(result.absoluteError)} {direction}
          </strong>
        </div>
      </div>
      <div className="button-row centered">
        <button className="primary-button" type="button" onClick={onRetry}>
          <RotateCcw />
          もう一回
        </button>
        <button className="secondary-button" type="button" onClick={onHome}>
          <Home />
          メニューへ
        </button>
      </div>
    </section>
  )
}

function AdminScreen({
  presets,
  adminPin,
  onBack,
  onChangePin,
  onChangePresets,
}: {
  presets: Preset[]
  adminPin: string
  onBack: () => void
  onChangePin: (pin: string) => void
  onChangePresets: (presets: Preset[]) => void
}) {
  const [editing, setEditing] = useState<Preset | null>(null)
  const [message, setMessage] = useState('')

  function upsertPreset(nextPreset: Preset) {
    const exists = presets.some((preset) => preset.id === nextPreset.id)
    const nextPresets = exists
      ? presets.map((preset) => (preset.id === nextPreset.id ? nextPreset : preset))
      : [...presets, nextPreset]
    onChangePresets(nextPresets)
    setEditing(null)
    setMessage('保存しました。')
  }

  function deletePreset(preset: Preset) {
    if (!confirm(`${preset.name}を削除しますか？`)) return
    onChangePresets(presets.filter((item) => item.id !== preset.id))
    setMessage('削除しました。')
  }

  function resetDefaults() {
    if (!confirm('プリセットとPINを初期状態に戻しますか？')) return
    resetLocalData()
    onChangePresets(DEFAULT_PRESETS)
    onChangePin('0000')
    setMessage('初期状態に戻しました。')
  }

  return (
    <section className="admin-screen">
      <header className="admin-header">
        <div>
          <p className="eyebrow">スタッフ用</p>
          <h1>管理者メニュー</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          <Home />
          プレイヤー画面
        </button>
      </header>

      {message && <p className="status-message">{message}</p>}

      <div className="admin-layout">
        <section className="panel">
          <div className="section-title-row">
            <h2>プリセット</h2>
            <button
              className="primary-button small"
              type="button"
              onClick={() => setEditing({ ...emptyPreset, id: makeId() })}
            >
              <Plus />
              追加
            </button>
          </div>
          <div className="preset-list">
            {presets.map((preset) => (
              <article className="preset-row" key={preset.id}>
                <span className="color-dot" style={{ background: preset.themeColor }} />
                <div>
                  <h3>{preset.name}</h3>
                  <p>
                    目標 {toSecondsLabel(preset.targetSeconds)} / 表示{' '}
                    {toSecondsLabel(preset.visibleUntilSeconds)}
                  </p>
                </div>
                <button
                  className="icon-button quiet"
                  type="button"
                  aria-label={`${preset.name}を編集`}
                  onClick={() => setEditing(preset)}
                >
                  <Pencil />
                </button>
                <button
                  className="icon-button quiet danger"
                  type="button"
                  aria-label={`${preset.name}を削除`}
                  onClick={() => deletePreset(preset)}
                >
                  <Trash2 />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          {editing ? (
            <PresetForm
              key={editing.id}
              preset={editing}
              onCancel={() => setEditing(null)}
              onSave={upsertPreset}
            />
          ) : (
            <JsonTools
              presets={presets}
              onImport={(nextPresets, mode) => {
                onChangePresets(mode === 'replace' ? nextPresets : [...presets, ...nextPresets])
                setMessage(mode === 'replace' ? '置き換えました。' : '追加しました。')
              }}
            />
          )}
        </section>

        <section className="panel admin-settings">
          <PinChangeForm adminPin={adminPin} onChangePin={onChangePin} />
          <button className="secondary-button danger-outline" type="button" onClick={resetDefaults}>
            <RotateCcw />
            初期状態に戻す
          </button>
        </section>
      </div>
    </section>
  )
}

function PresetForm({
  preset,
  onSave,
  onCancel,
}: {
  preset: Preset
  onSave: (preset: Preset) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Preset>(preset)
  const [errors, setErrors] = useState<string[]>([])

  function updateNumber(key: keyof Preset, value: string) {
    setDraft((current) => ({ ...current, [key]: Number(value) }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const nextDraft = { ...draft, name: draft.name.trim() }
    const nextErrors = validatePreset(nextDraft)
    setErrors(nextErrors)
    if (nextErrors.length === 0) onSave(nextDraft)
  }

  return (
    <form className="preset-form" noValidate onSubmit={submit}>
      <div className="section-title-row">
        <h2>プリセット編集</h2>
        <button className="secondary-button small" type="button" onClick={onCancel}>
          <ArrowLeft />
          閉じる
        </button>
      </div>
      <label>
        名前
        <input
          aria-label="プリセット名"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <div className="form-grid">
        <label>
          目標秒数
          <input
            aria-label="目標秒数"
            type="number"
            min="0.1"
            step="0.1"
            value={draft.targetSeconds}
            onChange={(event) => updateNumber('targetSeconds', event.target.value)}
          />
        </label>
        <label>
          表示秒数
          <input
            aria-label="表示秒数"
            type="number"
            min="0"
            max={draft.targetSeconds}
            step="0.1"
            value={draft.visibleUntilSeconds}
            onChange={(event) => updateNumber('visibleUntilSeconds', event.target.value)}
          />
          <span className="field-help">
            目標秒数以下にします。同じ秒数にすると最後まで表示します。
          </span>
        </label>
        <label>
          1等 誤差
          <input
            aria-label="1等 誤差"
            type="number"
            min="0"
            step="0.1"
            value={draft.firstPrizeError}
            onChange={(event) => updateNumber('firstPrizeError', event.target.value)}
          />
        </label>
        <label>
          2等 誤差
          <input
            aria-label="2等 誤差"
            type="number"
            min="0"
            step="0.1"
            value={draft.secondPrizeError}
            onChange={(event) => updateNumber('secondPrizeError', event.target.value)}
          />
        </label>
        <label>
          3等 誤差
          <input
            aria-label="3等 誤差"
            type="number"
            min="0"
            step="0.1"
            value={draft.thirdPrizeError}
            onChange={(event) => updateNumber('thirdPrizeError', event.target.value)}
          />
        </label>
        <label>
          色
          <input
            aria-label="テーマカラー"
            type="color"
            value={draft.themeColor}
            onChange={(event) => setDraft({ ...draft, themeColor: event.target.value })}
          />
        </label>
      </div>
      {errors.length > 0 && (
        <div className="form-error">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
      <button className="primary-button" type="submit">
        <Save />
        保存
      </button>
    </form>
  )
}

function JsonTools({
  presets,
  onImport,
}: {
  presets: Preset[]
  onImport: (presets: Preset[], mode: ImportMode) => void
}) {
  const [jsonText, setJsonText] = useState('')
  const [mode, setMode] = useState<ImportMode>('append')
  const [error, setError] = useState('')
  const exportJson = useMemo(() => JSON.stringify({ presets }, null, 2), [presets])

  function importJson() {
    try {
      const nextPresets = parsePresetJson(jsonText)
      onImport(nextPresets, mode)
      setJsonText('')
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'JSONを読み込めませんでした。')
    }
  }

  function exportFile() {
    const blob = new Blob([exportJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stoptimer-presets.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function loadFile(file: File | undefined) {
    if (!file) return
    setJsonText(await file.text())
  }

  return (
    <div className="json-tools">
      <div className="section-title-row">
        <h2>JSON</h2>
        <button className="secondary-button small" type="button" onClick={exportFile}>
          <Download />
          書き出し
        </button>
      </div>
      <textarea
        aria-label="JSON入力"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        placeholder='{"presets":[...]}'
      />
      <div className="button-row wrap">
        <label className="file-button">
          <FileJson />
          ファイル
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => loadFile(event.target.files?.[0])}
          />
        </label>
        <label className="radio-pill">
          <input
            type="radio"
            name="importMode"
            checked={mode === 'append'}
            onChange={() => setMode('append')}
          />
          追加
        </label>
        <label className="radio-pill">
          <input
            type="radio"
            name="importMode"
            checked={mode === 'replace'}
            onChange={() => setMode('replace')}
          />
          置き換え
        </label>
        <button className="primary-button small" type="button" onClick={importJson}>
          <Upload />
          読み込み
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

function PinChangeForm({
  adminPin,
  onChangePin,
}: {
  adminPin: string
  onChangePin: (pin: string) => void
}) {
  const [pin, setPin] = useState(adminPin)
  const [message, setMessage] = useState('')

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!/^\d{4,8}$/.test(pin)) {
      setMessage('PINは4から8桁の数字にしてください。')
      return
    }
    onChangePin(pin)
    setMessage('PINを変更しました。')
  }

  return (
    <form className="pin-form" onSubmit={submit}>
      <h2>PIN変更</h2>
      <label>
        新しいPIN
        <input
          inputMode="numeric"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
        />
      </label>
      <button className="primary-button small" type="submit">
        <Save />
        変更
      </button>
      {message && <p className="status-message compact">{message}</p>}
    </form>
  )
}

export default App
