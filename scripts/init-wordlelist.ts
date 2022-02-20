import fs from 'fs'
import axios from 'axios'

const LIB_URL =
  'https://raw.githubusercontent.com/elzup/jlpt-word-list/master/out/all.min.csv'

const filterChars = ['(', '〜']
const validWord = (w: string) =>
  [2, 3, 5].includes(w.length) && filterChars.every((c) => !w.includes(c))

async function main() {
  const res = await axios.get<string>(LIB_URL)
  const text = await res.data
  const lines = text.trim().split('\n')

  lines.shift()
  const words235 = lines
    .map((line) => line.split(','))
    .filter(([_a, w]) => validWord(w))
  const outText = words235.map((l) => l.join(',')).join('\n')

  fs.writeFileSync('./public/wordles.nohead.csv', outText)
}

main()
