import {
  generateNumberLine,
  generateLine1,
  generateLabelLine,
} from '../../../lib/text-transformer/binaryPacketDiagramTransformer'

describe('generateNumberLine', () => {
  it('オフセット0から始まる数字行を生成できること', () => {
    const result = generateNumberLine(0, 12)

    expect(result).toBe(
      '0    1    2    3    4    5    6    7    8    9    10   11   12'
    )
  })

  it('オフセット12から始まる数字行を生成できること', () => {
    const result = generateNumberLine(12, 24)

    expect(result).toBe(
      '12   13   14   15   16   17   18   19   20   21   22   23   24'
    )
  })

  it('小さなパケット用の数字行を生成できること', () => {
    const result = generateNumberLine(0, 3)

    expect(result).toBe('0    1    2    3')
  })
})

describe('generateSeparatorLine', () => {
  // 1から12までのすべての長さのテストケース
  it.each([
    [0, 1, false, '+-----'],
    [0, 2, false, '+----------'],
    [0, 3, false, '+---------------'],
    [0, 4, false, '+-------------------+'],
    [0, 5, false, '+-------------------+-----'],
    [0, 6, false, '+-------------------+----------'],
    [0, 7, false, '+-------------------+---------------'],
    [0, 8, false, '+-------------------+-------------------+'],
    [0, 9, false, '+-------------------+-------------------+-----'],
    //             12   13   14   15   16   17   18   19   20   21   22   23   24
    //              12   13   14   15   16   17   18   19   20   21   22   23   24
    [0, 10, false, '+-------------------+-------------------+----------'],
    [0, 11, false, '+-------------------+-------------------+---------------'],
    [
      0,
      12,
      false,
      '+-------------------+-------------------+-------------------+',
    ],
  ])(
    'オフセット%dから%dまでの区切り線を生成できること',
    (start, end, isWrapped, expected) => {
      const result = generateLine1(start, end, isWrapped)

      expect(result).toBe(expected)
    }
  )

  // 折り返し行のテスト
  it('折り返し用の区切り線を生成できること', () => {
    const result = generateLine1(12, 19, true)

    expect(result).toBe('+-------------------+---------------')
  })
})

describe('generateLabelLine', () => {
  it('標準的なラベル行を生成できること', () => {
    const data = [
      {
        name: 'header',
        offset: 0,
        type: 'uint8',
        length: 8,
        startPos: 0,
        endPos: 1,
      },
      {
        name: 'command',
        offset: 1,
        type: 'uint8',
        length: 32,
        startPos: 1,
        endPos: 5,
      },
      {
        name: 'length',
        offset: 5,
        type: 'uint16',
        length: 32,
        startPos: 5,
        endPos: 9,
      },
      {
        name: 'payload',
        offset: 9,
        type: 'bytes',
        length: 32,
        startPos: 9,
        endPos: 13,
      },
    ]
    const result = generateLabelLine(data, 0, 12, false, true)

    expect(result).toBe(
      '|header|command            |length              |payload       :'
    )
  })

  it('折り返し行のラベル行を生成できること', () => {
    const data = [
      {
        name: 'payload',
        offset: 12,
        type: 'bytes',
        length: 8,
        startPos: 12,
        endPos: 13,
        isPartial: true,
      },
      {
        name: 'status',
        offset: 13,
        type: 'uint8',
        length: 32,
        startPos: 13,
        endPos: 17,
      },
      {
        name: 'checksum',
        offset: 17,
        type: 'uint16',
        length: 16,
        startPos: 17,
        endPos: 19,
      },
    ]
    const result = generateLabelLine(data, 12, 19, true, false)

    expect(result).toBe(':payload|status             |checksum  |')
  })
})
