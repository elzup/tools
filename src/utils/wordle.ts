import { groupBy } from 'lodash'
import seedrandom from 'seedrandom'
import { Dict } from '../types'

export const TRY_LIMIT = 6

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
  reading: string
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

export type WordleGame = {
  target: string
  step: 'start' | 'failed' | 'clear'
  answerResults: WordleAnswerResult[]
}

export const initGame: WordleGame = {
  target: '',
  step: 'start',
  answerResults: [],
}

export const createGame = (target: string) => ({ ...initGame, target })
export function answer(game: WordleGame, answer: string): WordleGame {
  const result = wordleCheck(game.target, answer)

  const answerResults = [...game.answerResults, result]

  if (result.allOk) {
    return { ...game, answerResults, step: 'clear' }
  }
  const step = answerResults.length < TRY_LIMIT ? 'start' : 'failed'

  return { ...game, answerResults, step }
}

const ymd = (date: Date) =>
  String(date.getFullYear()).padStart(4, '0') +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0')

export const createTargetWordDaily = (lib: LibWordMap): LibWord =>
  createTargetWord(ymd(new Date()), lib)

export function createTargetWord(seed: string, lib: LibWordMap): LibWord {
  const rng = seedrandom(seed)

  const words = Object.values(lib)
  const libByLen = groupBy(words, (v) => v.reading.length)

  const r1 = rng()
  const r2 = rng()
  const r3 = rng()
  const len = r1 < 0.5 ? '5' : r1 < 0.75 ? '23' : '32'

  if (len === '5') {
    return libByLen['5'][Math.floor(libByLen['5'].length * r2)]
  }

  const first = libByLen[len[0]][Math.floor(libByLen[len[0]].length * r2)]
  const second = libByLen[len[1]][Math.floor(libByLen[len[1]].length * r3)]

  return {
    text: `${first.text}${second.text}`,
    reading: `${first.reading},${second.reading}`,
  }
}
