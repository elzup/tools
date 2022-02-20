import { WordleAnswerResult, wordleCheck } from '../utils/wordle'

const readable = (res: WordleAnswerResult) =>
  res.chars.map(({ char, judge: result }) => `${char} (${result})`).join(' ')

describe('wordle', () => {
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
