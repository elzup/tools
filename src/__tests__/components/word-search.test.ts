import {
  createMushikuiRegex,
  parseWordCsv,
  searchWords,
} from '../../components/WordSearch'

const words = parseWordCsv(`言葉,ことば
お母さん,おかあさん
検索,けんさく
掛け声,かけごえ
書き言葉,かきことば`)

describe('createMushikuiRegex', () => {
  it('matches one missing character with ?', () => {
    const regex = createMushikuiRegex('??ば')

    expect(regex?.test('ことば')).toBe(true)
    expect(regex?.test('かきことば')).toBe(false)
  })

  it('matches any length with *', () => {
    const regex = createMushikuiRegex('か*え')

    expect(regex?.test('かけごえ')).toBe(true)
  })

  it('returns null for empty patterns', () => {
    expect(createMushikuiRegex('   ')).toBeNull()
  })
})

describe('searchWords', () => {
  it('searches surfaces and readings', () => {
    expect(searchWords(words, '??ば', true)).toMatchObject([
      { surface: '言葉', reading: 'ことば', matchedBy: '読み' },
    ])
  })

  it('can search only surfaces', () => {
    expect(searchWords(words, '??ば', false)).toEqual([])
  })

  it('normalizes katakana patterns to hiragana', () => {
    expect(searchWords(words, 'ケン??', true)).toMatchObject([
      { surface: '検索', reading: 'けんさく', matchedBy: '読み' },
    ])
  })
})
