// 円周率の先頭 500 桁 (小数点は含めず、先頭の 3 から連続した数字列)
export const PI_DIGITS =
  '3' +
  '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '82148086513282306647093844609550582231725359408128' +
  '48111745028410270193852110555964462294895493038196' +
  '44288109756659334461284756482337867831652712019091' +
  '45648566923460348610454326648213393607260249141273' +
  '72458700660631558817488152092096282925409171536436' +
  '78925903600113305305488204665213841469519415116094' +
  '33057270365759591953092186117381932611793105118548' +
  '07446237996274956735188575272489122793818301194912'

export const MAX_GOAL = PI_DIGITS.length - 1

export type Carpet = {
  // rows[i][col] = i 桁目の行に敷かれた数字。rows[0] がスタート行 (下端)
  rows: string[][]
  // path[i] = i 桁目の正解セルの列
  path: number[]
}

const randomDigitExcept = (exclude: string) => {
  // 除外分を詰めた 9 通りから引く。引き直しループにしないのは、
  // 最悪ケースの回数が読めない乱数ループを盤面生成に持ち込まないため
  const digit = Math.floor(Math.random() * 9)
  return String(digit >= Number(exclude) ? digit + 1 : digit)
}

const randomDigit = () => String(Math.floor(Math.random() * 10))

// 進める先は真上と斜め上の 3 マス。生成側と操作側で同じ定義を使う
export const neighborCols = (col: number, cols: number) =>
  [col - 1, col, col + 1].filter((c) => c >= 0 && c < cols)

/**
 * 上方向に伸びる数字の絨毯を作る。各行で「直前の正解セルの真上・斜め上」の
 * 3 セルのうち、次の桁と一致するのはちょうど 1 つになるよう埋めるので、
 * 正解は常に一意で、goal 桁まで必ず登り切れる。
 */
export const buildCarpet = (goal: number, cols: number): Carpet => {
  const startCol = Math.floor(cols / 2)
  const rows: string[][] = [
    // スタート行にもう一つ 3 があるとルートの起点が二通りに見えるので除外する
    Array.from({ length: cols }, (_, col) =>
      col === startCol ? PI_DIGITS[0] : randomDigitExcept(PI_DIGITS[0])
    ),
  ]
  const path: number[] = [startCol]

  for (let step = 1; step <= goal; step++) {
    const digit = PI_DIGITS[step]
    const candidates = neighborCols(path[step - 1], cols)
    const nextCol = candidates[Math.floor(Math.random() * candidates.length)]
    const row = Array.from({ length: cols }, (_, col) => {
      if (col === nextCol) return digit
      // 候補セルに同じ数字を置くと正解が二つになるので、そこだけ除外する
      return candidates.includes(col) ? randomDigitExcept(digit) : randomDigit()
    })

    rows.push(row)
    path.push(nextCol)
  }

  return { rows, path }
}

export const formatTime = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 10))
  const minutes = Math.floor(total / 6000)
  const seconds = Math.floor(total / 100) % 60
  const centis = total % 100
  const body = `${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
  return minutes > 0 ? `${minutes}:${body}` : body
}
