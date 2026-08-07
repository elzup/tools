import {
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { OFF_ANGLE, buildBoard, cellAngles } from './font'

type Angles = [number, number]
type AngleMap = Map<string, Angles>
type IdleClock = { key: string; speedFactor: number }

const TICK_MS = 200
const OFF_ANGLES: Angles = [OFF_ANGLE, OFF_ANGLE]
const MAX_FRAME_SEC = 0.1
// 空回し中は 2 本の針を重ねる。この速度 (1/s) で短針を長針に寄せる
const SPIN_MERGE_RATE = 6

const cellKey = (row: number, col: number) => `${row}-${col}`

// 空回し中の時計が揃って見えないように、セルごとに速度を少しずらす
const speedFactorOf = (row: number, col: number) =>
  0.8 + (((row * 5 + col * 3) % 9) / 9) * 0.5

const pad2 = (value: number) => String(value).padStart(2, '0')

const timeToGroups = (date: Date, showSeconds: boolean): string[] => [
  pad2(date.getHours()),
  pad2(date.getMinutes()),
  ...(showSeconds ? [pad2(date.getSeconds())] : []),
]

/** -180..180 に正規化した角度差 */
const shortestDiff = (from: number, to: number) => {
  const forward = (((to - from) % 360) + 360) % 360

  return forward > 180 ? forward - 360 : forward
}

/** 現在角度から目標角度までの回転量 (sweep 時は必ず時計回り) */
const rotateTo = (current: number, target: number, isSweep: boolean) => {
  const forward = (((target - current) % 360) + 360) % 360
  const delta = isSweep || forward <= 180 ? forward : forward - 360

  return current + delta
}

/** 2 本の針への割り当ては回転量が小さい方を選ぶ */
const resolveAngles = (
  current: Angles,
  target: Angles,
  isSweep: boolean
): Angles => {
  const straight: Angles = [
    rotateTo(current[0], target[0], isSweep),
    rotateTo(current[1], target[1], isSweep),
  ]
  const swapped: Angles = [
    rotateTo(current[0], target[1], isSweep),
    rotateTo(current[1], target[0], isSweep),
  ]
  const cost = (next: Angles) =>
    Math.abs(next[0] - current[0]) + Math.abs(next[1] - current[1])

  return cost(straight) <= cost(swapped) ? straight : swapped
}

const ClockDigits = () => {
  const [showSeconds, setShowSeconds] = useState(false)
  const [isSweep, setIsSweep] = useState(true)
  const [isDark, setIsDark] = useState(true)
  const [isDimOff, setIsDimOff] = useState(false)
  const [isSpinIdle, setIsSpinIdle] = useState(true)
  const [spinSpeed, setSpinSpeed] = useState(540)
  const [shortRatio, setShortRatio] = useState(0.68)
  const [duration, setDuration] = useState(1.2)
  const [clockSize, setClockSize] = useState(26)
  const [stagger, setStagger] = useState(25)
  const [customText, setCustomText] = useState('')
  const [groups, setGroups] = useState<string[]>(['00', '00'])

  const trimmedCustom = customText.replace(/\s/g, '')

  useEffect(() => {
    if (trimmedCustom !== '') {
      setGroups(trimmedCustom.match(/.{1,2}/g) ?? [])
      return
    }

    const tick = () => {
      const next = timeToGroups(new Date(), showSeconds)

      setGroups((prev) => (prev.join(':') === next.join(':') ? prev : next))
    }

    tick()
    const timerId = setInterval(tick, TICK_MS)

    return () => clearInterval(timerId)
  }, [trimmedCustom, showSeconds])

  const board = useMemo(() => buildBoard(groups), [groups])

  // アニメーション中の実角度。空回しは毎フレーム書き換えるので Map を直接更新する
  const anglesRef = useRef<AngleMap>(new Map())
  const idleClocksRef = useRef<IdleClock[]>([])
  const handRefs = useRef(new Map<string, HTMLDivElement | null>())
  const spinSpeedRef = useRef(0)
  const [angles, setAngles] = useState<AngleMap>(new Map())

  useEffect(() => {
    const next: AngleMap = new Map()
    const idleClocks: IdleClock[] = []

    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const key = cellKey(rowIndex, colIndex)
        const current = anglesRef.current.get(key) ?? OFF_ANGLES
        const isIdle = cell.length === 0

        // 空回しに戻る時計は目標角度を持たせず、その場から回し続ける
        next.set(
          key,
          isIdle && isSpinIdle
            ? current
            : resolveAngles(current, cellAngles(cell), isSweep)
        )
        if (isIdle) {
          idleClocks.push({
            key,
            speedFactor: speedFactorOf(rowIndex, colIndex),
          })
        }
      })
    })

    anglesRef.current = next
    idleClocksRef.current = isSpinIdle ? idleClocks : []
    setAngles(next)
  }, [board, isSweep, isSpinIdle])

  spinSpeedRef.current = spinSpeed

  // 役割のない時計は針を回し続けて「動いている時計」に見せる
  useEffect(() => {
    if (!isSpinIdle) return

    let frameId = 0
    let prevTime = performance.now()

    const step = (time: number) => {
      const deltaSec = Math.min((time - prevTime) / 1000, MAX_FRAME_SEC)

      prevTime = time
      idleClocksRef.current.forEach(({ key, speedFactor }) => {
        const [long, short] = anglesRef.current.get(key) ?? OFF_ANGLES
        const nextLong = long + spinSpeedRef.current * speedFactor * deltaSec
        // 2 本の針の差を毎フレーム縮めて、重なったまま同速で回す。
        // 差は「回す前」の値を使う (回した後だと速度に比例した遅れが残る)
        const nextShort =
          nextLong +
          shortestDiff(long, short) * Math.exp(-deltaSec * SPIN_MERGE_RATE)
        const nextAngles: Angles = [nextLong, nextShort]

        anglesRef.current.set(key, nextAngles)
        nextAngles.forEach((angle, handIndex) => {
          const node = handRefs.current.get(`${key}-${handIndex}`)

          if (!node) return
          node.style.transitionDuration = '0s'
          node.style.transform = `translateX(-50%) rotate(${angle}deg)`
        })
      })
      frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frameId)
  }, [isSpinIdle])

  const colCount = board[0]?.length ?? 0
  const gap = Math.max(2, Math.round(clockSize * 0.12))
  const handWidth = Math.max(2, Math.round(clockSize * 0.09))

  return (
    <Stack gap={3}>
      <BoardScroll>
        <Board
          $dark={isDark}
          style={{
            gridTemplateColumns: `repeat(${colCount}, ${clockSize}px)`,
            gap: `${gap}px`,
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = cellKey(rowIndex, colIndex)
              const [angleA, angleB] = angles.get(key) ?? OFF_ANGLES
              const isIdle = cell.length === 0
              const isSpinning = isIdle && isSpinIdle
              const handStyle = {
                opacity: isDimOff && isIdle ? 0.18 : 1,
                transitionDuration: isSpinning ? '0s' : `${duration}s`,
                transitionDelay: isSpinning
                  ? '0s'
                  : `${(rowIndex + colIndex) * stagger}ms`,
              }

              return (
                <Face
                  key={key}
                  $dark={isDark}
                  style={{ width: clockSize, height: clockSize }}
                >
                  {/* 長針 */}
                  <Hand
                    ref={(node) => {
                      handRefs.current.set(`${key}-0`, node)
                    }}
                    $dark={isDark}
                    style={{
                      ...handStyle,
                      width: `${handWidth}px`,
                      height: '50%',
                      transform: `translateX(-50%) rotate(${angleA}deg)`,
                    }}
                  />
                  {/* 短針 */}
                  <Hand
                    ref={(node) => {
                      handRefs.current.set(`${key}-1`, node)
                    }}
                    $dark={isDark}
                    style={{
                      ...handStyle,
                      width: `${handWidth + 1}px`,
                      height: `${50 * shortRatio}%`,
                      transform: `translateX(-50%) rotate(${angleB}deg)`,
                    }}
                  />
                </Face>
              )
            })
          )}
        </Board>
      </BoardScroll>

      <Stack direction="row" gap={2} flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={showSeconds}
              onChange={(e) => setShowSeconds(e.target.checked)}
            />
          }
          label="秒も表示"
        />
        <FormControlLabel
          control={
            <Switch
              checked={isSweep}
              onChange={(e) => setIsSweep(e.target.checked)}
            />
          }
          label="常に時計回り"
        />
        <FormControlLabel
          control={
            <Switch
              checked={isDark}
              onChange={(e) => setIsDark(e.target.checked)}
            />
          }
          label="ダーク"
        />
        <FormControlLabel
          control={
            <Switch
              checked={isSpinIdle}
              onChange={(e) => setIsSpinIdle(e.target.checked)}
            />
          }
          label="余った時計を空回し"
        />
        <FormControlLabel
          control={
            <Switch
              checked={isDimOff}
              onChange={(e) => setIsDimOff(e.target.checked)}
            />
          }
          label="余った時計を薄く"
        />
        <TextField
          size="small"
          label="任意の数字 (空で現在時刻)"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="1234"
          sx={{ width: 200 }}
        />
      </Stack>

      <Stack direction="row" gap={4} flexWrap="wrap">
        <SliderBox>
          <Typography variant="caption">遷移時間 {duration}s</Typography>
          <Slider
            min={0.2}
            max={4}
            step={0.1}
            value={duration}
            onChange={(_, value) => setDuration(value as number)}
          />
        </SliderBox>
        <SliderBox>
          <Typography variant="caption">時計サイズ {clockSize}px</Typography>
          <Slider
            min={12}
            max={48}
            step={1}
            value={clockSize}
            onChange={(_, value) => setClockSize(value as number)}
          />
        </SliderBox>
        <SliderBox>
          <Typography variant="caption">空回しの速さ {spinSpeed}°/s</Typography>
          <Slider
            min={0}
            max={3600}
            step={30}
            value={spinSpeed}
            onChange={(_, value) => setSpinSpeed(value as number)}
            disabled={!isSpinIdle}
          />
        </SliderBox>
        <SliderBox>
          <Typography variant="caption">短針の長さ {shortRatio}</Typography>
          <Slider
            min={0.4}
            max={1}
            step={0.02}
            value={shortRatio}
            onChange={(_, value) => setShortRatio(value as number)}
          />
        </SliderBox>
        <SliderBox>
          <Typography variant="caption">波打ち {stagger}ms</Typography>
          <Slider
            min={0}
            max={80}
            step={1}
            value={stagger}
            onChange={(_, value) => setStagger(value as number)}
          />
        </SliderBox>
      </Stack>
    </Stack>
  )
}

const BoardScroll = styled.div`
  overflow-x: auto;
`

const Board = styled.div<{ $dark: boolean }>`
  display: grid;
  width: max-content;
  padding: 24px;
  border-radius: 8px;
  background: ${({ $dark }) => ($dark ? '#15171c' : '#f2f2f0')};
`

const Face = styled.div<{ $dark: boolean }>`
  position: relative;
  border-radius: 50%;
  background: ${({ $dark }) => ($dark ? '#22252c' : '#ffffff')};
  box-shadow: ${({ $dark }) =>
    $dark ? 'inset 0 0 0 1px #2e3239' : 'inset 0 0 0 1px #dedede'};
`

const Hand = styled.div<{ $dark: boolean }>`
  position: absolute;
  left: 50%;
  bottom: 50%;
  height: 50%;
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? '#f5f6f8' : '#1b1c1f')};
  transform-origin: 50% 100%;
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.45, 0.05, 0.2, 1);
  pointer-events: none;
`

const SliderBox = styled.div`
  width: 200px;
`

export default ClockDigits
