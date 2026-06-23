import {
  changedChars,
  clearHistory,
  combineAll,
  createHistory,
  deserializeHistory,
  promote,
  recordChange,
  recordOnCharDelta,
  recordOnInterval,
  removeEntry,
  restore,
  serializeHistory,
} from '../../../lib/history'

// 決定的な now / id を注入してテストする
const opts = (now: number) => ({ now, genId: () => `id-${now}` })

describe('recordChange', () => {
  test('空履歴に先頭追加する', () => {
    const { state, recorded } = recordChange(createHistory<string>(), 'a', {
      ...opts(100),
    })
    expect(recorded).toBe(true)
    expect(state.entries.map((e) => e.value)).toEqual(['a'])
    expect(state.entries[0].timestamp).toBe(100)
  })

  test('新しい記録は先頭に積まれる', () => {
    const s1 = recordChange(createHistory<string>(), 'a', opts(1)).state
    const s2 = recordChange(s1, 'b', opts(2)).state
    expect(s2.entries.map((e) => e.value)).toEqual(['b', 'a'])
  })

  test('shouldRecord が false なら state 不変・recorded false', () => {
    const s1 = recordChange(createHistory<string>(), 'aaaa', opts(1)).state
    const r = recordChange(s1, 'aaab', {
      ...opts(2),
      shouldRecord: recordOnCharDelta(2),
    })
    expect(r.recorded).toBe(false)
    expect(r.state).toBe(s1)
  })

  test('max を超えたら最古を捨てる', () => {
    let s = createHistory<number>()
    for (const n of [1, 2, 3, 4]) {
      s = recordChange(s, n, { ...opts(n), max: 2 }).state
    }
    expect(s.entries.map((e) => e.value)).toEqual([4, 3])
  })

  test('label を値から生成する', () => {
    const { state } = recordChange(createHistory<string>(), 'hello', {
      ...opts(1),
      label: (v) => `len:${v.length}`,
    })
    expect(state.entries[0].label).toBe('len:5')
  })
})

describe('restore', () => {
  const build = () => {
    const s1 = recordChange(createHistory<string>(), 'a', opts(1)).state
    const s2 = recordChange(s1, 'b', opts(2)).state

    return recordChange(s2, 'c', opts(3)).state // [c, b, a]
  }

  test('promote: 該当を先頭へ移動し値を返す', () => {
    const s = build()
    const r = restore(s, 'id-1', { mode: 'promote' })
    expect(r.value).toBe('a')
    expect(r.state.entries.map((e) => e.value)).toEqual(['a', 'c', 'b'])
    expect(r.state.entries).toHaveLength(3)
  })

  test('duplicate: 複製を先頭へ追加し元は残す', () => {
    const s = build()
    const r = restore(s, 'id-1', { mode: 'duplicate', ...opts(9) })
    expect(r.value).toBe('a')
    expect(r.state.entries.map((e) => e.value)).toEqual(['a', 'c', 'b', 'a'])
    expect(r.state.entries[0].id).toBe('id-9')
    expect(r.state.entries[0].timestamp).toBe(9)
  })

  test('存在しない id は value undefined・state 不変', () => {
    const s = build()
    const r = restore(s, 'nope')
    expect(r.value).toBeUndefined()
    expect(r.state).toBe(s)
  })

  test('promote が既定', () => {
    const s = build()
    expect(promote(s, 'id-2').entries.map((e) => e.value)).toEqual([
      'b',
      'c',
      'a',
    ])
  })
})

describe('removeEntry / clearHistory', () => {
  test('removeEntry は該当を除く', () => {
    const s1 = recordChange(createHistory<string>(), 'a', opts(1)).state
    const s2 = recordChange(s1, 'b', opts(2)).state
    expect(removeEntry(s2, 'id-1').entries.map((e) => e.value)).toEqual(['b'])
  })

  test('clearHistory は空に', () => {
    expect(clearHistory<string>().entries).toEqual([])
  })
})

describe('serialize / deserialize', () => {
  test('往復で復元できる', () => {
    const s = recordChange(createHistory<string>(), 'x', opts(5)).state
    const back = deserializeHistory<string>(serializeHistory(s))
    expect(back.entries).toEqual(s.entries)
  })

  test('壊れた文字列は空履歴', () => {
    expect(deserializeHistory<string>('not json').entries).toEqual([])
    expect(deserializeHistory<string>(null).entries).toEqual([])
  })

  test('必須欠落エントリと isValid 不合格を捨てる', () => {
    const text = JSON.stringify([
      { id: 'ok', value: 1, timestamp: 1 },
      { id: 'no-ts', value: 2 },
      { value: 3, timestamp: 3 },
      { id: 'bad-value', value: 'str', timestamp: 4 },
    ])
    const isNumber = (v: unknown): v is number => typeof v === 'number'
    const back = deserializeHistory<number>(text, isNumber)
    expect(back.entries.map((e) => e.value)).toEqual([1])
  })
})

describe('deciders', () => {
  test('changedChars は変化区間長を返す', () => {
    expect(changedChars('abc', 'abc')).toBe(0)
    expect(changedChars('abcXYZ', 'abcQQQQ')).toBe(4)
    expect(changedChars('hello', 'hello world')).toBe(6)
    expect(changedChars('', 'abcd')).toBe(4)
  })

  test('recordOnCharDelta は閾値以上の変化で true', () => {
    const decide = recordOnCharDelta(3)
    const prev = { id: 'x', value: 'hello', timestamp: 0 }
    expect(decide(prev, 'help', 0)).toBe(false) // 変化 2
    expect(decide(prev, 'world!!', 0)).toBe(true)
    expect(decide(undefined, 'anything', 0)).toBe(true) // 初回は常に true
  })

  test('recordOnInterval は経過時間で判定', () => {
    const decide = recordOnInterval<string>(1000)
    const prev = { id: 'x', value: 'a', timestamp: 5000 }
    expect(decide(prev, 'b', 5500)).toBe(false)
    expect(decide(prev, 'b', 6000)).toBe(true)
  })

  test('combineAll は AND', () => {
    const decide = combineAll(
      recordOnCharDelta(2),
      recordOnInterval<string>(1000)
    )
    const prev = { id: 'x', value: 'aa', timestamp: 0 }
    expect(decide(prev, 'bbbb', 500)).toBe(false) // 文字 OK・時間 NG
    expect(decide(prev, 'bbbb', 2000)).toBe(true)
  })
})
