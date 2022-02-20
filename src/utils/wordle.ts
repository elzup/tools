const resultTypes = ['non', 'nea', 'hit'] as const

export type WordleResultType = typeof resultTypes[number]
export type WordleResult = {
  char: string
  result: WordleResultType
}
export type WordleAnswerResult = {
  chars: WordleResult[]
  allOk: boolean
}

export const wordleCheck = (
  target: string,
  answer: string
): WordleAnswerResult => {
  const tChars = target.split('')
  const aChars = answer.split('')

  const chars = aChars.map(
    (char, i): WordleResult => ({
      char,
      result:
        char === tChars[i] ? 'hit' : tChars.includes(char) ? 'nea' : 'non',
    })
  )

  return { chars, allOk: chars.every(({ result }) => result === 'hit') }
}

// export const wordleTryable = (answer: string) => {}
