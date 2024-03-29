import {
  LibChecker,
  WordleAnswerResult,
  wordleCheck,
  wordleTryable,
  answer,
  createGame,
  createTargetWord,
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

const sampleResult: WordleAnswerResult = {
  allOk: true,
  chars: [
    { char: 'a', judge: 'hit' },
    { char: 'a', judge: 'nea' },
    { char: 'a', judge: 'nea' },
    { char: 'a', judge: 'nea' },
    { char: 'a', judge: 'nea' },
  ],
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

const game = createGame('abcde')

describe('answer', () => {
  it('continue', () => {
    expect(answer(game, 'fghij')).toMatchInlineSnapshot(`
      Object {
        "answerResults": Array [
          Object {
            "allOk": false,
            "chars": Array [
              Object {
                "char": "f",
                "judge": "non",
              },
              Object {
                "char": "g",
                "judge": "non",
              },
              Object {
                "char": "h",
                "judge": "non",
              },
              Object {
                "char": "i",
                "judge": "non",
              },
              Object {
                "char": "j",
                "judge": "non",
              },
            ],
          },
        ],
        "step": "start",
        "target": "abcde",
        "used": Object {},
      }
    `)
  })
  it('clear', () => {
    const game2 = {
      ...game,
      answerResults: [{ chars: [], allOk: false }],
    }

    const res = answer(game2, 'abcde')

    expect(res.answerResults.length).toMatchInlineSnapshot(`2`)
    expect(res.step).toMatchInlineSnapshot(`"clear"`)
  })
  it('failed', () => {
    const game2 = {
      ...game,
      answerResults: [
        sampleResult,
        sampleResult,
        sampleResult,
        sampleResult,
        sampleResult,
      ],
    }

    const res = answer(game2, 'aaaaa')

    expect(res.answerResults.length).toMatchInlineSnapshot(`6`)
    expect(res.step).toMatchInlineSnapshot(`"failed"`)
  })
})

const wordLib = {
  あいうえお: { reading: 'あいうえお', text: 'あいうえお' },
  なにぬねの: { reading: 'なにぬねの', text: 'なにぬねの' },
  かきく: { reading: 'かきく', text: 'かきく' },
  さしす: { reading: 'さしす', text: 'さしす' },
  たちつ: { reading: 'たちつ', text: 'たちつ' },
  けこ: { reading: 'けこ', text: 'けこ' },
  せそ: { reading: 'せそ', text: 'せそ' },
  てと: { reading: 'てと', text: 'てと' },
}

test('createTargetWord', () => {
  expect(createTargetWord('20220101', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "てと,かきく",
      "text": "てとかきく",
    }
  `)
  expect(createTargetWord('20220102', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "さしす,てと",
      "text": "さしすてと",
    }
  `)
  expect(createTargetWord('20220103', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "てと,かきく",
      "text": "てとかきく",
    }
  `)
  expect(createTargetWord('20220104', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "なにぬねの",
      "text": "なにぬねの",
    }
  `)
  expect(createTargetWord('20220105', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "かきく,せそ",
      "text": "かきくせそ",
    }
  `)
  expect(createTargetWord('20220106', wordLib)).toMatchInlineSnapshot(`
    Object {
      "reading": "あいうえお",
      "text": "あいうえお",
    }
  `)
})
