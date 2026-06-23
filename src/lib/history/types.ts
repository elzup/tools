/**
 * 汎用の変更履歴モジュールの型 (spec:history)
 * 任意の値 T を時系列で保持し、「新規履歴として残すか」の判定 (RecordDecider) と
 * restore による並び替えを抽象化する。localStorage への永続化は useHistory が担う。
 */

/** 履歴 1 件。entries 配列の順序が表示順 (index 0 = 最新)。timestamp は表示用メタ。 */
export type HistoryEntry<T> = {
  /** エントリ識別子 (採番)。 */
  id: string
  /** 保存した値。 */
  value: T
  /** 記録時刻 (ms epoch)。 */
  timestamp: number
  /** 任意の表示ラベル (一覧の見出し等)。 */
  label?: string
}

/** 履歴全体。entries は新しい順 (先頭が最新)。 */
export type HistoryState<T> = {
  entries: HistoryEntry<T>[]
}

/**
 * 新規履歴として記録すべきかの判定。
 * prev = 現在の最新エントリ (無ければ undefined)、next = 記録候補の値、now = 現在時刻 (ms)。
 * 「何文字変わったら」「何 ms 経ったら」等はこの述語で表現する。
 */
export type RecordDecider<T> = (
  prev: HistoryEntry<T> | undefined,
  next: T,
  now: number
) => boolean

/** restore の挙動。promote = 該当を先頭へ移動、duplicate = 複製を先頭へ追加 (元は据え置き)。 */
export type RestoreMode = 'promote' | 'duplicate'
