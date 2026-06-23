/**
 * ブラウザ (localStorage) に変更履歴を残す汎用 hook (spec:history)
 * 任意の値 T を扱える。`record(value)` で記録を試み (新規判定は shouldRecord)、
 * `restore(id)` で過去の値を取り出しつつ履歴の順序を変更する。
 *
 * 例:
 *   const history = useHistory<string>('myEditor:history', {
 *     shouldRecord: recordOnCharDelta(10), // 10 文字以上変わったら記録
 *     max: 50,
 *   })
 *   history.record(text)            // 変化が閾値未満なら false で何もしない
 *   const past = history.restore(id) // 復元値。先頭へ昇格して順序も更新
 */
import { useLocalStorage } from './useLocalStorage'
import {
  type HistoryEntry,
  type HistoryState,
  type RecordDecider,
  type RestoreMode,
  clearHistory,
  createHistory,
  recordChange,
  removeEntry,
  restore,
} from '../lib/history'

export type UseHistoryOptions<T> = {
  /** 新規履歴として記録すべきかの判定。省略時は常に記録。 */
  shouldRecord?: RecordDecider<T>
  /** 保持件数の上限 (古いものから捨てる)。 */
  max?: number
  /** エントリのラベルを値から生成する。 */
  label?: (value: T) => string | undefined
}

export type UseHistoryResult<T> = {
  /** 新しい順のエントリ一覧 (先頭が最新)。 */
  entries: HistoryEntry<T>[]
  /** 最新エントリ (無ければ undefined)。 */
  latest: HistoryEntry<T> | undefined
  /** 値を記録する。実際に記録されたら true、判定で弾かれたら false。 */
  record: (value: T) => boolean
  /** 過去エントリを復元して値を返す。順序も mode に従って更新する。 */
  restore: (id: string, mode?: RestoreMode) => T | undefined
  /** 指定エントリを削除する。 */
  remove: (id: string) => void
  /** 全消去する。 */
  clear: () => void
}

export const useHistory = <T>(
  key: string,
  options: UseHistoryOptions<T> = {}
): UseHistoryResult<T> => {
  const [state, setState] = useLocalStorage<HistoryState<T>>(
    key,
    createHistory<T>()
  )
  const { shouldRecord, max, label } = options

  const record = (value: T): boolean => {
    const result = recordChange(state, value, { shouldRecord, max, label })

    if (result.recorded) setState(result.state)

    return result.recorded
  }

  const restoreEntry = (id: string, mode?: RestoreMode): T | undefined => {
    const result = restore(state, id, { mode, max })

    if (result.state !== state) setState(result.state)

    return result.value
  }

  const remove = (id: string) => setState(removeEntry(state, id))
  const clear = () => setState(clearHistory<T>())

  return {
    entries: state.entries,
    latest: state.entries[0],
    record,
    restore: restoreEntry,
    remove,
    clear,
  }
}
