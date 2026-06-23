/**
 * RecordDecider のファクトリ集 (spec:history)
 * 「新規履歴として残すか」の判定を組み合わせ可能な小さな述語として提供する。
 */
import type { RecordDecider } from './types'

/** 常に記録する。 */
export const recordAlways =
  <T>(): RecordDecider<T> =>
  () =>
    true

/** 直前の値と異なるときだけ記録する (JSON 比較)。 */
export const recordOnChange =
  <T>(): RecordDecider<T> =>
  (prev, next) =>
    prev === undefined || !deepEqual(prev.value, next)

/**
 * 変化した文字数が threshold 以上のときに記録する (T = string 用)。
 * 共通の接頭辞・接尾辞を除いた「変化した範囲」の長さで判定する (簡易 diff)。
 */
export const recordOnCharDelta =
  (threshold: number): RecordDecider<string> =>
  (prev, next) =>
    prev === undefined || changedChars(prev.value, next) >= threshold

/** 直前の記録から minMs 以上経過したときに記録する。 */
export const recordOnInterval =
  <T>(minMs: number): RecordDecider<T> =>
  (prev, _next, now) =>
    prev === undefined || now - prev.timestamp >= minMs

/** すべての decider が true のときだけ true (AND)。 */
export const combineAll =
  <T>(...deciders: RecordDecider<T>[]): RecordDecider<T> =>
  (prev, next, now) =>
    deciders.every((d) => d(prev, next, now))

/** いずれかの decider が true なら true (OR)。 */
export const combineAny =
  <T>(...deciders: RecordDecider<T>[]): RecordDecider<T> =>
  (prev, next, now) =>
    deciders.some((d) => d(prev, next, now))

/**
 * 2 つの文字列で変化した文字数を見積もる。
 * 共通接頭辞長 p と共通接尾辞長 s を引いた、変化区間の最大長を返す。
 * 例: "abcXYZ" と "abcQQQQ" → 変化区間は "XYZ"/"QQQQ" なので 4。
 */
export const changedChars = (a: string, b: string): number => {
  const la = a.length
  const lb = b.length
  let p = 0
  while (p < la && p < lb && a[p] === b[p]) p++
  let s = 0
  while (s < la - p && s < lb - p && a[la - 1 - s] === b[lb - 1 - s]) s++

  return Math.max(la, lb) - p - s
}

const deepEqual = (a: unknown, b: unknown): boolean =>
  a === b || JSON.stringify(a) === JSON.stringify(b)
