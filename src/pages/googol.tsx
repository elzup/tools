import { Box, Button, Slider, Stack, Typography } from '@mui/material'
import { useState, useCallback, useRef } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const GEAR_COUNT = 100
const GEAR_RATIO = 10n // 10回転で次の歯車が1回転

const title = 'Googol Visualizer - 10^100 歯車装置'

/**
 * BigInt から各歯車の回転位置(0.0-9.999...)を取得
 * 連続的な値で、後ろの歯車ほどゆっくり回転する
 */
function getGearPositions(value: bigint): number[] {
  const positions: number[] = []
  let remaining = value < 0n ? -value : value
  for (let i = 0; i < GEAR_COUNT; i++) {
    // 下位2桁を取得して小数精度を確保（0.0〜9.9の範囲）
    const twoDigits = remaining % 100n
    const position = Number(twoDigits) / 10
    positions.push(position)
    remaining = remaining / GEAR_RATIO
  }
  return positions
}

/**
 * 歯車コンポーネント
 */
type GearProps = {
  index: number
  position: number // 0.0-9.999... (連続値)
  size: number
}

function Gear({ index, position, size }: GearProps) {
  const angle = (position / 10) * 360
  const teethCount = 10
  const innerRadius = size * 0.3
  const outerRadius = size * 0.45

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2}, ${size / 2}) rotate(${angle})`}>
        {/* 歯車の歯 */}
        {Array.from({ length: teethCount }).map((_, i) => {
          const toothAngle = (i / teethCount) * 360
          const rad = (toothAngle * Math.PI) / 180
          const x1 = Math.cos(rad) * innerRadius
          const y1 = Math.sin(rad) * innerRadius
          const x2 = Math.cos(rad) * outerRadius
          const y2 = Math.sin(rad) * outerRadius
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#666"
              strokeWidth={size * 0.08}
              strokeLinecap="round"
            />
          )
        })}
        {/* 中心の円 */}
        <circle r={innerRadius} fill="#888" stroke="#555" strokeWidth={1} />
        {/* 回転マーカー */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={-innerRadius * 0.8}
          stroke="#f44"
          strokeWidth={size * 0.06}
          strokeLinecap="round"
        />
      </g>
      {/* インデックス表示 */}
      <text
        x={size / 2}
        y={size - 2}
        textAnchor="middle"
        fontSize={size * 0.2}
        fill="#333"
      >
        {index}
      </text>
    </svg>
  )
}

/**
 * 歯車グループ（可視範囲）
 */
type GearGroupProps = {
  positions: number[]
  startIndex: number
  count: number
  gearSize: number
}

function GearGroup({ positions, startIndex, count, gearSize }: GearGroupProps) {
  const visiblePositions = positions.slice(startIndex, startIndex + count)
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
        justifyContent: 'center',
      }}
    >
      {visiblePositions.map((pos, i) => (
        <Gear
          key={startIndex + i}
          index={startIndex + i}
          position={pos}
          size={gearSize}
        />
      ))}
    </Box>
  )
}

// BigInt を文字列として保持するためのヘルパー
const addBigIntStr = (a: string, b: number): string => {
  const result = BigInt(a) + BigInt(b)
  return result < 0n ? '0' : result.toString()
}

const GoogolPage = () => {
  // BigInt は React の状態として問題があるため文字列で保持
  const [counterStr, setCounterStr] = useState('0')
  const [sliderValue, setSliderValue] = useState(50)
  const lastSliderRef = useRef(50)

  const positions = getGearPositions(BigInt(counterStr))

  const handleIncrement = useCallback(() => {
    setCounterStr((prev) => addBigIntStr(prev, 1))
  }, [])

  const handleDecrement = useCallback(() => {
    setCounterStr((prev) => addBigIntStr(prev, -1))
  }, [])

  const handleReset = useCallback(() => {
    setCounterStr('0')
    setSliderValue(50)
    lastSliderRef.current = 50
  }, [])

  const handleSliderChange = useCallback(
    (_: Event, value: number | number[]) => {
      const newValue = value as number
      const diff = Math.abs(newValue - lastSliderRef.current)
      if (diff !== 0) {
        setCounterStr((prev) => addBigIntStr(prev, diff))
      }
      lastSliderRef.current = newValue
      setSliderValue(newValue)
    },
    []
  )

  const handleSliderCommit = useCallback(() => {
    // スライダーを離したら中央にリセット（無限に擦れるように）
    setSliderValue(50)
    lastSliderRef.current = 50
  }, [])

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      {/* 歯車表示（メイン） */}
      <Box
        sx={{
          p: 2,
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #ddd',
          mb: 3,
        }}
      >
        <GearGroup
          positions={positions}
          startIndex={0}
          count={GEAR_COUNT}
          gearSize={70}
        />
      </Box>

      {/* コントロール */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center">
          <Button variant="contained" onClick={handleDecrement}>
            -1
          </Button>
          <Button variant="contained" onClick={handleIncrement}>
            +1
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Stack>

        {/* スライダー（左右に擦ると+） */}
        <Box sx={{ px: 2, maxWidth: 400, mx: 'auto' }}>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommit}
            min={0}
            max={100}
            step={1}
          />
        </Box>
      </Box>

      {/* 現在の値 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          回転数:
        </Typography>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
          }}
        >
          {counterStr}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          桁数: {counterStr.length}
        </Typography>
      </Box>

      {/* 説明 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          10回転で次の歯車を1回転させる歯車が100枚。
          最初の歯車を googol (10^100) 回まわすと、最後の歯車が1回転します。
        </Typography>
      </Box>
    </Layout>
  )
}

export default GoogolPage
