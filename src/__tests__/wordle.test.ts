import {
  WordleAnswerResult,
  wordleCheck,
  wordleTryable,
  LibChecker,
} from '../utils/wordle'

const readable = (res: WordleAnswerResult) =>
  res.chars.map(({ char, judge: result }) => `${char} (${result})`).join(' ')

describe('wordleCheck', () => {
  it('allOk', () => {
    const res = wordleCheck('abcde', 'abcde')

    expect(res.allOk).toBe(true)
    expect(readable(res)).toMatchInlineSnapshot(
      `"a (hit) b (hit) c (hit) d (hit) e (hit)"`
    )
  })

  it('near', () => {
    const res = wordleCheck('clear', 'noncl')

    expect(res.allOk).toBe(false)
    expect(readable(res)).toMatchInlineSnapshot(
      `"n (non) o (non) n (non) c (nea) l (nea)"`
    )
  })
  it('utf8', () => {
    const res = wordleCheck('つくえゆか', 'くろいあか')

    expect(res.allOk).toBe(false)
    expect(readable(res)).toMatchInlineSnapshot(
      `"く (nea) ろ (non) い (non) あ (non) か (hit)"`
    )
  })
})

const lib: LibChecker = {
  あいうえお: true,
  かき: true,
  くけこ: true,
  さしす: true,
  せそ: true,
}

describe('wordleTryable', () => {
  it('match 5', () => {
    expect(wordleTryable('あいうえお', lib)).toBe(true)
  })
  it('match 2,3', () => {
    expect(wordleTryable('かきくけこ', lib)).toBe(true)
    expect(wordleTryable('せそくけこ', lib)).toBe(true)
  })
  it('match 3,2', () => {
    expect(wordleTryable('さしすせそ', lib)).toBe(true)
    expect(wordleTryable('さしすかき', lib)).toBe(true)
  })
  it('non match', () => {
    expect(wordleTryable('さしすてと', lib)).toBe(false)
    expect(wordleTryable('たちつてと', lib)).toBe(false)
    expect(wordleTryable('えおあいう', lib)).toBe(false)
    expect(wordleTryable('さしすけこ', lib)).toBe(false)
  })
})
