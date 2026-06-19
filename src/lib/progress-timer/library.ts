/**
 * 保存スロット (named presets) の永続化 (spec:library)
 * テキストの `@9:00 projA_001` の id をキーに複数の予定を保持し、
 * クリックで切り替えられるようにする。各エントリの予定は share の
 * serializePlan を再利用して保存し、破損したエントリは読み込み時に取り除く。
 */
import type { PlanState } from './types'
import { deserializePlan, serializePlan } from './share'

export type SavedPlan = {
  /** スロット識別子 (= plan.id)。 */
  id: string
  plan: PlanState
}

/** localStorage に書き込む素の形 (予定は URL 安全文字列で保持)。 */
type StoredEntry = {
  id: string
  data: string
}

/** SavedPlan[] を保存用文字列へ。 */
export function serializeLibrary(library: SavedPlan[]): string {
  const entries: StoredEntry[] = library.map((e) => ({
    id: e.id,
    data: serializePlan(e.plan),
  }))

  return JSON.stringify(entries)
}

/** 保存文字列を SavedPlan[] へ復元。破損エントリ・不正値は除外する。 */
export function deserializeLibrary(text: string | null): SavedPlan[] {
  if (!text) return []
  try {
    const raw = JSON.parse(text)

    if (!Array.isArray(raw)) return []

    return raw.flatMap((e): SavedPlan[] => {
      if (typeof e?.id !== 'string' || !e.id) return []
      const plan = deserializePlan(e.data)

      if (!plan) return []

      return [{ id: e.id, plan: { ...plan, id: e.id } }]
    })
  } catch {
    return []
  }
}

/**
 * 予定をその id のスロットへ保存する (immutable)。
 * 同じ id があれば上書き、無ければ末尾に追加する。id 無しは何もしない。
 */
export function upsertLibrary(
  library: SavedPlan[],
  plan: PlanState
): SavedPlan[] {
  if (!plan.id) return library
  const entry: SavedPlan = { id: plan.id, plan }
  const exists = library.some((e) => e.id === plan.id)

  return exists
    ? library.map((e) => (e.id === plan.id ? entry : e))
    : [...library, entry]
}

/** 指定スロットを削除する (immutable)。 */
export function removeFromLibrary(
  library: SavedPlan[],
  id: string
): SavedPlan[] {
  return library.filter((e) => e.id !== id)
}
