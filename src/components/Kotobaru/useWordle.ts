import { useState } from 'react'
import useSWR from 'swr'
import { initGame, WordleGame } from '../../utils/wordle'

type Word = {
  full: string
  chars: string
}

const wordParse = (text: string): Word[] =>
  text
    .trim()
    .split('\n')
    .map((line) => line.split(','))
    .map(([full, chars]) => ({ full, chars }))

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.text())
    .then(wordParse)

export function useWordle() {
  const { data: words } = useSWR('/wordles.nohead.csv', fetcher)

  const [_game, _setGame] = useState<WordleGame>(initGame)

  return words
}
