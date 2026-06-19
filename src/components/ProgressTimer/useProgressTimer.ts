import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ActualState,
  type PlanState,
  type SavedPlan,
  computeActualRows,
  computePlanRows,
  createStep,
  currentStepIndex,
  decodePlanText,
  defaultPlan,
  deserializeLibrary,
  deserializePlan,
  emptyActual,
  planEndClockMin,
  removeFromLibrary,
  serializeLibrary,
  serializePlan,
  setAbsoluteEnd,
  setCumulativeEnd,
  setDuration,
  shiftBoundary,
  startActual,
  stepProgress,
  totalDurationMin,
  upsertLibrary,
} from '../../lib/progress-timer'

const STORAGE_KEY = 'progress-timer:plan'
const LIBRARY_KEY = 'progress-timer:library'

/** 当日 0:00 からの分 (秒を小数で含む)。 */
const clockNowMin = (): number => {
  const d = new Date()

  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/** URL ?d= > localStorage > 既定 の優先で初期 plan を読む (REQ-SH06/07/08)。 */
const loadInitialPlan = (): PlanState => {
  if (typeof window === 'undefined') return defaultPlan()
  const fromUrl = new URLSearchParams(window.location.search).get('d')

  if (fromUrl) {
    const p = deserializePlan(fromUrl)

    if (p) return p
  }
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (stored) {
    const p = deserializePlan(stored)

    if (p) return p
  }

  return defaultPlan()
}

/** 保存スロット一覧を localStorage から読む。 */
const loadInitialLibrary = (): SavedPlan[] => {
  if (typeof window === 'undefined') return []

  return deserializeLibrary(window.localStorage.getItem(LIBRARY_KEY))
}

export function useProgressTimer() {
  const [plan, setPlan] = useState<PlanState>(loadInitialPlan)
  const [actual, setActual] = useState<ActualState>(emptyActual)
  const [nowMin, setNowMin] = useState<number>(clockNowMin)
  const [library, setLibrary] = useState<SavedPlan[]>(loadInitialLibrary)

  // ライブ時計 (REQ-U05)
  useEffect(() => {
    const id = setInterval(() => setNowMin(clockNowMin()), 1000)

    return () => clearInterval(id)
  }, [])

  // 自動保存 (REQ-SH06)
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializePlan(plan))
    } catch {
      /* localStorage 不可環境は無視 */
    }
  }, [plan])

  // 保存スロット一覧の永続化
  useEffect(() => {
    try {
      window.localStorage.setItem(LIBRARY_KEY, serializeLibrary(library))
    } catch {
      /* localStorage 不可環境は無視 */
    }
  }, [library])

  const planRows = useMemo(() => computePlanRows(plan), [plan])
  const actualRows = useMemo(
    () => computeActualRows(plan, actual),
    [plan, actual]
  )
  const curIndex = currentStepIndex(plan, actual, nowMin)
  const progress = stepProgress(plan, actual, nowMin)
  const started = actual.startedAtMin !== null

  // --- 予定編集 ---
  const setStartClock = useCallback(
    (t: number) => setPlan((p) => ({ ...p, startClockMin: Math.max(0, t) })),
    []
  )
  const editDuration = useCallback(
    (i: number, min: number) => setPlan((p) => setDuration(p, i, min)),
    []
  )
  const editAbsoluteEnd = useCallback(
    (i: number, t: number) => setPlan((p) => setAbsoluteEnd(p, i, t)),
    []
  )
  const editCumulativeEnd = useCallback(
    (i: number, c: number) => setPlan((p) => setCumulativeEnd(p, i, c)),
    []
  )
  const renameStep = useCallback(
    (i: number, name: string) =>
      setPlan((p) => ({
        ...p,
        steps: p.steps.map((s, idx) => (idx === i ? { ...s, name } : s)),
      })),
    []
  )
  const addStep = useCallback(
    () => setPlan((p) => ({ ...p, steps: [...p.steps, createStep('', 10)] })),
    []
  )
  const removeStep = useCallback(
    (i: number) =>
      setPlan((p) => ({
        ...p,
        steps: p.steps.filter((_, idx) => idx !== i),
      })),
    []
  )
  // テキスト編集モードからの反映 (spec:textproto)
  const setPlanFromText = useCallback(
    (text: string) =>
      setPlan((p) => decodePlanText(text, p.startClockMin, p.id)),
    []
  )

  // --- 保存スロット ---
  // 編集テキストの再初期化トリガ (スロット読込時に PlanTextEditor を作り直す)
  const [loadRevision, setLoadRevision] = useState(0)

  /** 現在の予定を id のスロットへ保存 (id 無しは不可)。 */
  const saveSlot = useCallback(
    () => setLibrary((lib) => upsertLibrary(lib, plan)),
    [plan]
  )
  /** スロットを編集中の予定として読み込む。 */
  const loadSlot = useCallback(
    (id: string) => {
      const entry = library.find((e) => e.id === id)

      if (!entry) return
      setPlan(entry.plan)
      setActual(emptyActual())
      setLoadRevision((r) => r + 1)
    },
    [library]
  )
  /** スロットを削除する。 */
  const removeSlot = useCallback(
    (id: string) => setLibrary((lib) => removeFromLibrary(lib, id)),
    []
  )

  // --- 実績制御 ---
  const start = useCallback(() => setActual(startActual(clockNowMin())), [])
  const customStart = useCallback(
    (t: number) => setActual({ startedAtMin: t, boundaryDeltas: {} }),
    []
  )
  const reset = useCallback(() => setActual(emptyActual()), [])
  const shift = useCallback(
    (boundaryIndex: number, deltaMin: number) =>
      setActual((a) => shiftBoundary(a, boundaryIndex, deltaMin)),
    []
  )

  const buildShareUrl = useCallback((): string => {
    const base =
      typeof window === 'undefined'
        ? ''
        : `${window.location.origin}${window.location.pathname}`

    return `${base}?d=${serializePlan(plan)}`
  }, [plan])

  return {
    plan,
    planRows,
    actualRows,
    nowMin,
    curIndex,
    progress,
    started,
    totalMin: totalDurationMin(plan),
    endClockMin: planEndClockMin(plan),
    setStartClock,
    editDuration,
    editAbsoluteEnd,
    editCumulativeEnd,
    renameStep,
    addStep,
    removeStep,
    setPlanFromText,
    start,
    customStart,
    reset,
    shift,
    buildShareUrl,
    // 保存スロット
    library,
    loadRevision,
    saveSlot,
    loadSlot,
    removeSlot,
  }
}

export type ProgressTimerApi = ReturnType<typeof useProgressTimer>
