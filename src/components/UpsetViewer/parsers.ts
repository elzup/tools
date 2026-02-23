import { parse as parseTagSet } from 'tagset-parser'

export type Elem = { name: string; sets: string[] }

export type ParserType = 'setList' | 'tagSet'

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

/**
 * TagSet DSL format:
 * 例:
 *   set A 赤
 *   set B 青
 *   item A&B x,y
 *   A : 1, 2
 */
const parseTagSetDSL = (input: string): Elem[] => {
  const ast = parseTagSet(input)
  const setLabels = ast.sets.map((s) => s.label)

  return ast.items.flatMap((item) => {
    const memberSets = setLabels.filter((_, i) => (item.bitmask & (1 << i)) !== 0)
    return item.values.map((v) => ({ name: v, sets: memberSets }))
  })
}

export const parsers: Record<ParserType, ParserDef> = {
  setList: {
    label: 'Set List',
    placeholder: 'A: 1, 2, 3\nB: 2, 3, 4',
    defaultInput: `A: 1, 2, 3, 4, 5\nB: 3, 4, 5, 6, 7\nC: 5, 6, 7, 8, 9`,
    parse: parseSetList,
  },
  tagSet: {
    label: 'TagSet DSL',
    placeholder: 'set A 赤\nset B 青\nA,B : x, y\nA : 1, 2',
    defaultInput: `set A 赤\nset B 青\nset C 緑\nA : 1, 2, 3\nB : 4, 5\nA,B : 6, 7\nA,C : 8\nA,B,C : 9`,
    parse: parseTagSetDSL,
  },
}

export const PARSER_TYPES = Object.keys(parsers) as ParserType[]
