export type WeekdayStep = {
  name: string
  label: string
  value: number
  explain: string
}

export type WeekdayResult = {
  input: string
  month: number
  steps: WeekdayStep[]
  weekday: string
  weekdayIndex: number
  isLeapYear: boolean
  leapAdjust: number
}

const MONTH_CODES: Record<number, number> = {
  1: 0,
  2: 3,
  3: 3,
  4: 6,
  5: 1,
  6: 4,
  7: 6,
  8: 2,
  9: 5,
  10: 0,
  11: 3,
  12: 5,
}

const CENTURY_CODES: Record<number, number> = {
  1500: 0,
  1600: 6,
  1700: 4,
  1800: 2,
  1900: 0,
  2000: 6,
  2100: 4,
  2200: 2,
  2300: 0,
  2400: 6,
  2500: 4,
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const WEEKDAY_NAMES_JA = [
  '日曜日',
  '月曜日',
  '火曜日',
  '水曜日',
  '木曜日',
  '金曜日',
  '土曜日',
]

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function parseDate(
  input: string
): { year: number; month: number; day: number } | null {
  const s = input.trim()
  // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (月日は1-2桁OK)
  const sep = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (sep) {
    return {
      year: parseInt(sep[1], 10),
      month: parseInt(sep[2], 10),
      day: parseInt(sep[3], 10),
    }
  }
  // YYYYMMDD (8桁)
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) {
    return {
      year: parseInt(compact[1], 10),
      month: parseInt(compact[2], 10),
      day: parseInt(compact[3], 10),
    }
  }
  return null
}

export function calculateWeekday(dateStr: string): WeekdayResult | null {
  const parsed = parseDate(dateStr)
  if (!parsed) return null

  const { year, month, day } = parsed

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const centuryBase = Math.floor(year / 100) * 100
  const centuryCode = CENTURY_CODES[centuryBase]
  if (centuryCode === undefined) return null

  const y = year % 100
  const yDiv4 = Math.floor(y / 4)
  const isLeap = isLeapYear(year)

  const monthCode = MONTH_CODES[month]
  const leapAdjust = isLeap && (month === 1 || month === 2) ? -1 : 0
  const adjustedMonthCode = monthCode + leapAdjust

  const steps: WeekdayStep[] = [
    {
      name: 'century_code',
      label: '世紀コード (C)',
      value: centuryCode,
      explain: `${centuryBase}年代の世紀コード: ${centuryCode}`,
    },
    {
      name: 'year_extract',
      label: '年下2桁 (y)',
      value: y,
      explain: `${year} の下2桁: ${y}`,
    },
    {
      name: 'year_div4',
      label: 'floor(y/4)',
      value: yDiv4,
      explain: `floor(${y}/4) = ${yDiv4}`,
    },
    {
      name: 'month_code',
      label: '月コード (m)',
      value: adjustedMonthCode,
      explain: leapAdjust
        ? `${month}月のコード: ${monthCode}, 閏年補正 ${leapAdjust} → ${adjustedMonthCode}`
        : `${month}月のコード: ${adjustedMonthCode}`,
    },
    {
      name: 'day',
      label: '日 (D)',
      value: day,
      explain: `日付の日: ${day}`,
    },
  ]

  const vals = [centuryCode, y, yDiv4, adjustedMonthCode, day]
  const reduced = vals.map((v) => ((v % 7) + 7) % 7)
  const reducedSum = reduced.reduce((a, b) => a + b, 0)
  steps.push({
    name: 'sum',
    label: '合計',
    value: reducedSum,
    explain: `${reduced.join(' + ')} = ${reducedSum}`,
  })

  const mod7 = ((reducedSum % 7) + 7) % 7
  steps.push({
    name: 'mod7',
    label: 'mod 7',
    value: mod7,
    explain: `${reducedSum} mod 7 = ${mod7}`,
  })

  return {
    input: dateStr,
    month,
    steps,
    weekday: `${WEEKDAY_NAMES[mod7]} / ${WEEKDAY_NAMES_JA[mod7]}`,
    weekdayIndex: mod7,
    isLeapYear: isLeap,
    leapAdjust,
  }
}

export { MONTH_CODES, CENTURY_CODES, WEEKDAY_NAMES, WEEKDAY_NAMES_JA }
