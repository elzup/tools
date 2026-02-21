export type Elem = { name: string; sets: string[] }

export type ParserType = 'setList'

export type ParserDef = {
  label: string
  placeholder: string
  defaultInput: string
  parse: (input: string) => Elem[]
}

/**
 * Set List format: 1行に1集合
 * 例:
 *   A: 1, 2, 3
 *   B: 2, 3, 4
 */
const parseSetList = (input: string): Elem[] => {
  const setMap = new Map<string, string[]>()

  input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) return
      const setName = line.slice(0, colonIndex).trim()
      const elements = line
        .slice(colonIndex + 1)
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)

      elements.forEach((el) => {
        const existing = setMap.get(el)
        if (existing) {
          existing.push(setName)
        } else {
          setMap.set(el, [setName])
        }
      })
    })

  return [...setMap.entries()].map(([name, sets]) => ({ name, sets }))
}

export const parsers: Record<ParserType, ParserDef> = {
  setList: {
    label: 'Set List',
    placeholder: 'A: 1, 2, 3\nB: 2, 3, 4',
    defaultInput: `A: 1, 2, 3, 4, 5\nB: 3, 4, 5, 6, 7\nC: 5, 6, 7, 8, 9`,
    parse: parseSetList,
  },
}

export const PARSER_TYPES = Object.keys(parsers) as ParserType[]
