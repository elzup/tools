import type { ReactNode } from 'react'

// シーケンス図の 1 step と、その step で各 actor の保持情報がどう変わるかの定義

export type Item = { k: string; v?: string; secret?: boolean }
export type ShownItem = Item & { isNew: boolean; isGone: boolean }
export type MsgKind = 'normal' | 'secret' | 'ok' | 'local'

type Dyn<C, T> = T | ((c: C) => T)
type ByVault<T> = Partial<Record<string, T[]>>

export type Step<C> = {
  phase?: string
  /** actor 番号 (1 始まり) の [from, to]。note と排他 */
  msg?: [number, number]
  /** actor 番号。そのライフライン上の処理として描く */
  note?: number
  kind?: Dyn<C, MsgKind>
  label: Dyn<C, ReactNode>
  title: string
  desc: Dyn<C, ReactNode>
  add?: Dyn<C, ByVault<Item>>
  rm?: Dyn<C, ByVault<string>>
}

export type Vault = { key: string; title: string; isWire?: boolean }

export type Scenario<C> = {
  actors: string[]
  vaults: Vault[]
  steps: Step<C>[]
}

export const resolve = <C, T>(x: Dyn<C, T>, c: C): T =>
  typeof x === 'function' ? (x as (c: C) => T)(c) : x

/**
 * idx 番目の step 時点の保持情報。
 * その step で増えたものは isNew、その step で捨てたものは isGone で 1 回だけ見せ、次の step から消す。
 */
export const stateAt = <C>(
  sc: Scenario<C>,
  idx: number,
  c: C
): Record<string, ShownItem[]> =>
  sc.steps
    .slice(0, idx + 1)
    .reduce<Record<string, ShownItem[]>>((acc, st, i) => {
      const isCur = i === idx
      const add = (st.add && resolve(st.add, c)) || {}
      const rm = (st.rm && resolve(st.rm, c)) || {}
      return Object.fromEntries(
        sc.vaults.map(({ key }) => {
          const removed = rm[key] ?? []
          const added = (add[key] ?? []).map((it) => ({
            ...it,
            isNew: isCur,
            isGone: false,
          }))
          const kept = (acc[key] ?? [])
            .map((it) => ({ ...it, isNew: false }))
            .flatMap((it) =>
              removed.includes(it.k)
                ? isCur
                  ? [{ ...it, isGone: true }]
                  : []
                : [it]
            )
            .filter((it) => !added.some((a) => a.k === it.k))
          return [key, [...kept, ...added]]
        })
      )
    }, {})
