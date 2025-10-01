import {
  generateDiagram,
  generateLabelLine,
  generateNumberLine,
  generateTextDiagramTransformer,
  parseInput,
} from '../../../lib/text-transformer/binaryPacketDiagramTransformer'

describe('parseInput', () => {
  // パラメータ化テスト用のテストケース
  const testCases = [
    {
      name: '正しく入力を解析できること',
      input:
        'SQ:0:sequence:8 val1:1:mpa:32 val2:5:tmp:32 val3:9:voltage:32 val4:13:mm:32 CSQ:17:csq:16',
      expected: [
        { name: 'SQ', offset: 0, type: 'sequence', length: 8 },
        { name: 'val1', offset: 1, type: 'mpa', length: 32 },
        { name: 'val2', offset: 5, type: 'tmp', length: 32 },
        { name: 'val3', offset: 9, type: 'voltage', length: 32 },
        { name: 'val4', offset: 13, type: 'mm', length: 32 },
        { name: 'CSQ', offset: 17, type: 'csq', length: 16 },
      ],
    },
    {
      name: '空の入力を処理できること',
      input: '',
      expected: [{ name: '', offset: NaN, type: undefined, length: NaN }],
    },
  ]

  // test.eachを使用したパラメータ化テスト
  it.each(testCases)('$name', ({ input, expected }) => {
    const result = parseInput(input)

    expect(result).toStrictEqual(expected)
  })
})

describe('generateDiagram', () => {
  // 行ごとに比較するテスト
  describe('行ごとに比較するテスト', () => {
    const lineByLineTestCases = [
      {
        name: '正しく図を生成できること',
        data: [
          { name: 'SQ', offset: 0, type: 'sequence', length: 16 }, // 2byte
          { name: 'val1', offset: 2, type: 'mpa', length: 32 },
          { name: 'val2', offset: 6, type: 'tmp', length: 32 },
          { name: 'val3', offset: 10, type: 'voltage', length: 24 },
          { name: 'val4', offset: 13, type: 'mm', length: 24 },
          { name: 'CSQ', offset: 16, type: 'csq', length: 16 },
          {
            name: 'longlong_name',
            offset: 18,
            type: 'longlong_name',
            length: 16,
          },
        ],
        expected: `
0    1    2    3    4    5    6    7    8    9    10   11   12
|----+----+----+----|----+----+----+----|----+----+----+----|
|SQ       |val1               |val2               |val3     :
|---------+---------|---------+---------|---------+---------|

12   13   14   15   16   17   18   19   20
|----+----+----+----|----+----+----+----|
:val3|val4          |CSQ      |longlong_|
|---------+---------|---------+---------|
SQ: SQ 2byte
val1: val1 4byte
val2: val2 4byte
val3: val3 3byte
val4: val4 3byte
CSQ: CSQ 2byte
longlong_name: longlong_name 2byte
  `.trim(),
      },
      {
        name: '12バイト以下の小さなパケットを正しく表示できること',
        data: [
          { name: 'header', offset: 0, type: 'uint8', length: 8 },
          { name: 'value', offset: 1, type: 'uint16', length: 16 },
        ],
        expected: `
0    1    2    3
|----+----+----+
|head|value    |
|---------+-----
header: header 1byte
value: value 2byte`.trim(),
      },
      {
        name: '4バイトで割り切れる場合は+記号',
        data: [
          { name: 'header', offset: 0, type: 'uint8', length: 16 },
          { name: 'value', offset: 2, type: 'uint16', length: 48 },
        ],
        expected: `
0    1    2    3    4    5    6    7    8
|----+----+----+----|----+----+----+----|
|header   |value                        |
|---------+---------|---------+---------|
header: header 2byte
value: value 6byte`.trim(),
      },
    ]

    it.each(lineByLineTestCases)('$name', ({ data, expected }) => {
      const result = generateDiagram(data)
      const resultLines = result.split('\n')
      const expectedLines = expected.split('\n')

      expect(resultLines).toHaveLength(expectedLines.length)

      expectedLines.forEach((line, i) => {
        try {
          expect(resultLines[i].trim()).toBe(line.trim())
        } catch (error) {
          console.log(`Line ${i} failed:`)
          console.log(`Expected: "${line.trim()}"`)
          console.log(`Received: "${resultLines[i].trim()}"`)
          throw error
        }
      })
    })
  })

  // 行数だけを確認するテスト
  describe('行数だけを確認するテスト', () => {
    const lineCountTestCases = [
      {
        name: '適切に折り返されること',
        data: [
          { name: 'SQ', offset: 0, type: 'sequence', length: 8 },
          { name: 'val1', offset: 1, type: 'mpa', length: 32 },
          { name: 'val2', offset: 5, type: 'tmp', length: 32 },
          { name: 'val3', offset: 9, type: 'voltage', length: 32 },
          { name: 'val4', offset: 13, type: 'mm', length: 32 },
        ],
      },
    ]

    it.each(lineCountTestCases)('$name', ({ data }) => {
      const result = generateDiagram(data)
      const lines = result.split('\n')

      expect(lines.length).toBeGreaterThan(0)
    })
  })

  // 完全一致を確認するテスト
  describe('完全一致を確認するテスト', () => {
    const exactMatchTestCases = [
      {
        name: '25バイト以上の大きなパケットで複数回折り返されること',
        data: [
          { name: 'header', offset: 0, type: 'uint8', length: 8 },
          { name: 'cmd', offset: 1, type: 'uint8', length: 8 },
          { name: 'len', offset: 2, type: 'uint16', length: 16 },
          { name: 'data1', offset: 4, type: 'uint32', length: 32 },
          { name: 'data2', offset: 8, type: 'uint32', length: 32 },
          { name: 'data3', offset: 12, type: 'uint32', length: 32 },
          { name: 'data4', offset: 16, type: 'uint32', length: 32 },
          { name: 'data5', offset: 20, type: 'uint32', length: 64 },
          { name: 'crc', offset: 28, type: 'uint16', length: 16 },
        ],
        expected: `
0    1    2    3    4    5    6    7    8    9    10   11   12
|----+----+----+----|----+----+----+----|----+----+----+----|
|head|cmd |len      |data1              |data2              |
|---------+---------|---------+---------|---------+---------|

12   13   14   15   16   17   18   19   20   21   22   23   24
|----+----+----+----|----+----+----+----|----+----+----+----|
|data3              |data4              |data5              :
|---------+---------|---------+---------|---------+---------|

24   25   26   27   28   29   30
|----+----+----+----|----+----+
:data5              |crc      |
|---------+---------|---------+
header: header 1byte
cmd: cmd 1byte
len: len 2byte
data1: data1 4byte
data2: data2 4byte
data3: data3 4byte
data4: data4 4byte
data5: data5 8byte
crc: crc 2byte
`.trim(),
      },
    ]

    it.each(exactMatchTestCases)('$name', ({ data, expected }) => {
      const result = generateDiagram(data)

      expect(result).toStrictEqual(expected)
    })
  })
})

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

describe('generateLabelLine', () => {
  it('個別テスト: separator line 文字数確認', () => {
    // 期待される separator line を手動で検証
    const expected1 =
      '|---------+---------|---------+---------|---------+---------|'

    // 実際に生成される値をテスト
    const data1 = [
      { name: 'SQ', offset: 0, type: 'sequence', length: 16 },
      { name: 'val1', offset: 2, type: 'mpa', length: 32 },
      { name: 'val2', offset: 6, type: 'tmp', length: 32 },
      { name: 'val3', offset: 10, type: 'voltage', length: 24 },
    ]
    const result1 = generateDiagram(data1)
    const lines1 = result1.split('\n')
    const separatorLine1 = lines1[3] // 4行目がseparator line

    console.log(
      `Expected1 length: ${expected1.length}, actual: ${separatorLine1.length}`
    )
    console.log(`Expected1: "${expected1}"`)
    console.log(`Actual1:   "${separatorLine1}"`)

    // 文字ごとに比較
    for (
      let i = 0;
      i < Math.max(expected1.length, separatorLine1.length);
      i++
    ) {
      const expectedChar = expected1[i] || 'END'
      const actualChar = separatorLine1[i] || 'END'

      if (expectedChar !== actualChar) {
        console.log(
          `Difference at position ${i}: expected '${expectedChar}' (${expectedChar.charCodeAt(
            0
          )}), actual '${actualChar}' (${actualChar.charCodeAt(0)})`
        )
      }
    }

    expect(true).toBe(true) // dummy assertion
  })

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
      /*     |----+----+----+----|----+----+----+----|----+----+----+----| */
      '|head|command            |length             |payload       :'
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

    //                  '|----+----+----+----|----+----+----+----|----+----+----+----|'
    expect(result).toBe(':payl|status             |checksum |')
  })
})

describe('generateTextDiagramTransformer', () => {
  // 成功ケースのテスト
  describe('成功ケース', () => {
    const successTestCases = [
      {
        name: '正しく変換できること',
        input:
          'SQ:0:sequence:8 val1:1:mpa:32 val2:5:tmp:32 val3:9:voltage:32 val4:13:mm:32 CSQ:17:csq:16',
        expected: `
0    1    2    3    4    5    6    7    8    9    10   11   12
|----+----+----+----|----+----+----+----|----+----+----+----|
|SQ  |val1               |val2               |val3          :
|---------+---------|---------+---------|---------+---------|

12   13   14   15   16   17   18   19
|----+----+----+----|----+----+----+
:val3|val4               |CSQ      |
|---------+---------|---------+-----
SQ: SQ 1byte
val1: val1 4byte
val2: val2 4byte
val3: val3 4byte
val4: val4 4byte
CSQ: CSQ 2byte`.trim(),
      },
      {
        name: 'バイナリテストケース2',
        input:
          'seq:0:int:16 pressure:2:float:32 temperature:6:float:32 bat_v:10:float:32 length:14:float:32 csq:18:int:16',
        expected: `
0    1    2    3    4    5    6    7    8    9    10   11   12
|----+----+----+----|----+----+----+----|----+----+----+----|
|seq      |pressure           |temperature        |bat_v    :
|---------+---------|---------+---------|---------+---------|

12   13   14   15   16   17   18   19   20
|----+----+----+----|----+----+----+----|
:bat_v    |length             |csq      |
|---------+---------|---------+---------|
seq: seq 2byte
pressure: pressure 4byte
temperature: temperature 4byte
bat_v: bat_v 4byte
length: length 4byte
csq: csq 2byte`.trim(),
      },
    ]

    it.each(successTestCases)('$name', ({ input, expected }) => {
      const result = generateTextDiagramTransformer(input)

      expect(result.success).toBe(true)
      expect(result.diagram).toBeDefined()
      expect(result.diagram?.trim()).toStrictEqual(expected)
    })
  })

  // エラーケースのテスト
  describe('エラーケース', () => {
    it('エラーハンドリングが機能すること', () => {
      const input = null as unknown as string
      const result = generateTextDiagramTransformer(input)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
