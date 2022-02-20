const resultTypes = ['non', 'nea', 'hit'] as const

export type CharJudge = typeof resultTypes[number]
export type CharResult = {
  char: string
  judge: CharJudge
}
export type WordleAnswerResult = {
  chars: CharResult[]
  allOk: boolean
}

const charJudge = (tar: string, ans: string, tars: string[]): CharJudge => {
  if (ans === tar) return 'hit'
  if (tars.includes(ans)) return 'nea'
  return 'non'
}

export const wordleCheck = (
  target: string,
  answer: string
): WordleAnswerResult => {
  const tars = target.split('')
  const anss = answer.split('')

  const chars = anss.map(
    (char, i): CharResult => ({
      char,
      judge: charJudge(tars[i], char, tars),
    })
  )

  return { chars, allOk: chars.every(({ judge }) => judge === 'hit') }
}

// export const wordleTryable = (answer: string) => {}
