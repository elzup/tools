import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { formatBit, formatCS, formatHex } from '../lib/clockFormats'

type ClockFormat = 'hex' | 'bit' | 'cs'

const formats: ClockFormat[] = ['hex', 'bit', 'cs']

function useCurrentTime() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return time
}

function formatTime(date: Date, format: ClockFormat): string {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()

  switch (format) {
    case 'hex':
      return formatHex(h, m, s)
    case 'bit':
      return formatBit(h, m, s)
    case 'cs':
      return formatCS(h, m, s)
  }
}

type Props = {
  compact?: boolean
}

export function Clock({ compact = false }: Props) {
  const time = useCurrentTime()
  const [formatIndex, setFormatIndex] = useState(0)

  const currentFormat = formats[formatIndex]

  const handleClick = () => {
    setFormatIndex((i) => (i + 1) % formats.length)
  }

  if (!time) {
    return <ClockWrapper $compact={compact}>--:--:--</ClockWrapper>
  }

  return (
    <ClockWrapper onClick={handleClick} $compact={compact}>
      {formatTime(time, currentFormat)}
    </ClockWrapper>
  )
}

const ClockWrapper = styled.span<{ $compact: boolean }>`
  font-family: 'Courier New', Consolas, monospace;
  font-size: ${({ $compact }) => ($compact ? '12px' : '14px')};
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`

export default Clock
