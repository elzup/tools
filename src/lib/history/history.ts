/**
 * 変更履歴のコア (spec:history)
 * すべて immutable な純関数。時刻と ID は引数で注入でき (テスト容易)、
 * 省略時のみ Date.now / 乱数を使う。
 */
import type {
  HistoryEntry,
  HistoryState,
  RecordDecider,
  RestoreMode,
} from './types'

const defaultNow = () => Date.now()
const defaultGenId = (now: number) =>
  `h-${now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

/** 空の履歴を作る。 */
export const createHistory = <T>(): HistoryState<T> => ({ entries: [] })

/** 最新エントリ (無ければ undefined)。 */
export const latest = <T>(
  state: HistoryState<T>
): HistoryEntry<T> | undefined => state.entries[0]

export type RecordOptions<T> = {
  /** 記録するかの判定。省略時は常に記録。 */
  shouldRecord?: RecordDecider<T>
  /** 保持件数の上限 (古いものから捨てる)。省略時は無制限。 */
  max?: number
  /** エントリのラベルを値から生成する。 */
  label?: (value: T) => string | undefined
  now?: number
  genId?: (now: number) => string
}

/**
 * 値を新規履歴として先頭に積む。shouldRecord が false なら state を変えず recorded:false。
 * max を超えたぶんは末尾 (最古) から落とす。
 */
export const recordChange = <T>(
  state: HistoryState<T>,
  value: T,
  options: RecordOptions<T> = {}
): { state: HistoryState<T>; recorded: boolean } => {
  const now = options.now ?? defaultNow()
  const decide = options.shouldRecord ?? (() => true)

  if (!decide(state.entries[0], value, now)) {
    return { state, recorded: false }
  }
  const entry: HistoryEntry<T> = {
    id: (options.genId ?? defaultGenId)(now),
    value,
    timestamp: now,
    label: options.label?.(value),
  }
  const entries = capEntries([entry, ...state.entries], options.max)

  return { state: { entries }, recorded: true }
}

/**
 * 指定エントリを復元する。値を返しつつ、mode に従って順序を変更する。
 * promote: 該当を先頭へ移動 / duplicate: 複製を新 ID・新時刻で先頭へ追加 (元は残す)。
 * 該当 ID が無ければ value:undefined で state は不変。
 */
export const restore = <T>(
  state: HistoryState<T>,
  id: string,
  options: {
    mode?: RestoreMode
    max?: number
    now?: number
    genId?: (now: number) => string
  } = {}
): { state: HistoryState<T>; value: T | undefined } => {
  const target = state.entries.find((e) => e.id === id)

  if (!target) return { state, value: undefined }
  const mode = options.mode ?? 'promote'

  if (mode === 'duplicate') {
    const now = options.now ?? defaultNow()
    const copy: HistoryEntry<T> = {
      ...target,
      id: (options.genId ?? defaultGenId)(now),
      timestamp: now,
    }
    const entries = capEntries([copy, ...state.entries], options.max)

    return { state: { entries }, value: target.value }
  }

  const rest = state.entries.filter((e) => e.id !== id)

  return { state: { entries: [target, ...rest] }, value: target.value }
}

/** 指定エントリを先頭へ移動する (順序変更のみ)。 */
export const promote = <T>(
  state: HistoryState<T>,
  id: string
): HistoryState<T> => restore(state, id, { mode: 'promote' }).state

/** 指定エントリを削除する。 */
export const removeEntry = <T>(
  state: HistoryState<T>,
  id: string
): HistoryState<T> => ({
  entries: state.entries.filter((e) => e.id !== id),
})

/** 全消去。 */
export const clearHistory = <T>(): HistoryState<T> => ({ entries: [] })

/** 上限件数に収める (先頭優先で残し、末尾を捨てる)。 */
const capEntries = <T>(
  entries: HistoryEntry<T>[],
  max?: number
): HistoryEntry<T>[] =>
  max !== undefined && max > 0 && entries.length > max
    ? entries.slice(0, max)
    : entries

/** HistoryState を保存文字列へ。 */
export const serializeHistory = <T>(state: HistoryState<T>): string =>
  JSON.stringify(state.entries)

/**
 * 保存文字列を HistoryState へ復元する。配列でない・必須フィールド欠落の
 * エントリは捨てる。isValid を渡すと value の妥当性も検査して破損を除外する。
 */
export const deserializeHistory = <T>(
  text: string | null,
  isValid?: (value: unknown) => value is T
): HistoryState<T> => {
  if (!text) return createHistory<T>()
  try {
    const raw = JSON.parse(text)

    if (!Array.isArray(raw)) return createHistory<T>()
    const entries = raw.flatMap((e): HistoryEntry<T>[] => {
      if (typeof e?.id !== 'string' || typeof e?.timestamp !== 'number') {
        return []
      }
      if (isValid && !isValid(e.value)) return []

      return [
        {
          id: e.id,
          value: e.value as T,
          timestamp: e.timestamp,
          label: typeof e.label === 'string' ? e.label : undefined,
        },
      ]
    })

    return { entries }
  } catch {
    return createHistory<T>()
  }
}
