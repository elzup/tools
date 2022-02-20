import { Dict } from '../types'

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

export type LibWord = {
  text: string
  raeding: string
}

export type LibChecker = Dict<true>
export type LibWordMap = Dict<LibWord>

export const wordleTryable = (answer: string, lib: LibChecker) => {
  const head2 = answer.substring(0, 2)
  const head3 = answer.substring(0, 3)
  const tail2 = answer.substring(3, 5)
  const tail3 = answer.substring(2, 5)

  return Boolean(
    lib[answer] || (lib[head2] && lib[tail3]) || (lib[head3] && lib[tail2])
  )
}
