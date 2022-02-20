import { useEffect } from 'react'
import useSWR from 'swr'

type WordleGame = {}

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
  const { data: words, error } = useSWR('/wordles.nohead.csv', fetcher)

  return words
}
