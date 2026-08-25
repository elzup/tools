import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled, { createGlobalStyle, keyframes } from 'styled-components'
import Confetti from './Confetti'
import {
  drawWheel,
  indexAtPointer,
  renderFace,
  rotationForIndex,
} from './wheel'

const SPIN_MS = 5200
// 最低これだけ余分に回してから止める (一瞬で止まると回した実感が無い)
const MIN_TURNS = 6
const EXTRA_TURNS = 5
const DEFAULT_ITEMS = ['たこ焼き', 'ラーメン', 'カレー', '寿司', '焼肉', 'そば']

// 名簿を貼ると行番号が混ざるので、数字だけの行 (1 / 2. / 3、) は項目にしない
const NUMBER_ONLY = /^[0-9]+[.、.)）:：]?$/

const parseItems = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !NUMBER_ONLY.test(line))

// 終盤で急激に減速する easing。最後の 1 秒をじらすのが目的
const easeOut = (t: number) => 1 - (1 - t) ** 4

const randomIndex = (count: number) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)

    crypto.getRandomValues(buf)

    return buf[0] % count
  }

  return Math.floor(Math.random() * count)
}

type Props = { title: string; initialItems: string[] }

const Roulette = ({ title, initialItems }: Props) => {
  const [text, setText] = useState(
    (initialItems.length > 0 ? initialItems : DEFAULT_ITEMS).join('\n')
  )
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [burst, setBurst] = useState(0)
  const [removeWinner, setRemoveWinner] = useState(false)

  const items = useMemo(() => parseItems(text), [text])
  const itemsRef = useRef(items)
  const rotationRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinRef = useRef<{ from: number; to: number; start: number } | null>(
    null
  )
  const winnerIndexRef = useRef<number | null>(null)
  const faceRef = useRef<HTMLCanvasElement | null>(null)
  const faceKeyRef = useRef('')

  itemsRef.current = items
  winnerIndexRef.current = winnerIndex

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) return
    let raf = 0

    if (!faceRef.current) faceRef.current = document.createElement('canvas')
    const face = faceRef.current

    const render = (time: number) => {
      const dpr = window.devicePixelRatio || 1
      const size = canvas.clientWidth

      if (size === 0) {
        raf = requestAnimationFrame(render)

        return
      }
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr
        canvas.height = size * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const faceKey = `${size}|${itemsRef.current.join('\u0000')}`

      if (faceKeyRef.current !== faceKey) {
        faceKeyRef.current = faceKey
        renderFace(face, size, itemsRef.current)
      }

      const spin = spinRef.current

      if (spin) {
        const t = Math.min(1, (time - spin.start) / SPIN_MS)

        rotationRef.current = spin.from + (spin.to - spin.from) * easeOut(t)
        if (t >= 1) {
          spinRef.current = null
          const index = indexAtPointer(
            rotationRef.current,
            itemsRef.current.length
          )

          setWinnerIndex(index)
          setWinner(itemsRef.current[index] ?? null)
          setHistory((prev) => [itemsRef.current[index], ...prev].slice(0, 30))
          setBurst((prev) => prev + 1)
          setIsSpinning(false)
        }
      }

      drawWheel({
        ctx,
        face,
        size,
        count: itemsRef.current.length,
        rotation: rotationRef.current,
        winnerIndex: spinRef.current ? null : winnerIndexRef.current,
        time,
      })
      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)

    return () => cancelAnimationFrame(raf)
  }, [])

  const spin = useCallback(() => {
    if (spinRef.current || items.length === 0) return
    const index = randomIndex(items.length)
    const turns = MIN_TURNS + Math.floor(Math.random() * EXTRA_TURNS)

    setWinner(null)
    setWinnerIndex(null)
    setIsSpinning(true)
    setIsPanelOpen(false)
    spinRef.current = {
      from: rotationRef.current,
      to: rotationForIndex(index, items.length, rotationRef.current, turns),
      start: performance.now(),
    }
  }, [items.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName

      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        spin()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [spin])

  const closeResult = () => {
    if (removeWinner && winner !== null) {
      setText(items.filter((_, i) => i !== winnerIndex).join('\n'))
      setWinnerIndex(null)
    }
    setWinner(null)
  }

  return (
    <Screen>
      <Neon />
      <Confetti trigger={burst} />
      <Title data-test="roulette-title">{title}</Title>

      <Stage>
        <WheelBox $spinning={isSpinning}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </WheelBox>

        <SpinButton onClick={spin} disabled={isSpinning || items.length === 0}>
          {isSpinning ? 'SPINNING…' : 'S P I N !'}
        </SpinButton>
        <Hint>Space / Enter でも回せる · {items.length} 件</Hint>
      </Stage>

      <Panel $open={isPanelOpen}>
        <PanelToggle onClick={() => setIsPanelOpen((prev) => !prev)}>
          {isPanelOpen ? '▼ 閉じる' : '▲ 項目を編集'}
        </PanelToggle>
        <PanelBody>
          <TextArea
            value={text}
            spellCheck={false}
            placeholder={'改行区切りで入力\nたこ焼き\nラーメン'}
            onChange={(e) => setText(e.target.value)}
          />
          <PanelSide>
            <label>
              <input
                type="checkbox"
                checked={removeWinner}
                onChange={(e) => setRemoveWinner(e.target.checked)}
              />
              当たりを除外する
            </label>
            <History>
              {history.map((name, i) => (
                <li key={`${name}-${history.length - i}`}>{name}</li>
              ))}
            </History>
          </PanelSide>
        </PanelBody>
      </Panel>

      {winner !== null && (
        <Result onClick={closeResult} data-test="roulette-result">
          <ResultLabel>WINNER</ResultLabel>
          <ResultName>{winner}</ResultName>
          <ResultClose>タップして閉じる</ResultClose>
        </Result>
      )}
    </Screen>
  )
}

const Neon = createGlobalStyle`
  body {
    margin: 0;
    background: #0a0016;
    overflow: hidden;
  }
`

const hueShift = keyframes`
  to { filter: hue-rotate(360deg); }
`
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
`
const pop = keyframes`
  0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
`
const shake = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 2px); }
  75% { transform: translate(3px, -2px); }
`

const Screen = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-family: 'Zen Kaku Gothic New', system-ui, sans-serif;
  background:
    radial-gradient(circle at 50% 0%, #3a0a5c 0%, #0a0016 60%),
    repeating-conic-gradient(from 0deg, rgba(255, 255, 255, 0.04) 0deg 6deg, transparent 6deg 12deg);
  overflow: hidden;
`

const Title = styled.h1`
  margin: 0.4rem 0 0;
  flex: none;
  font-size: clamp(1.4rem, 4vw, 2.6rem);
  letter-spacing: 0.12em;
  background: linear-gradient(90deg, #ffd84d, #ff2fb3, #00e5ff, #ffd84d);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 24px rgba(255, 47, 179, 0.5);
  animation: ${hueShift} 8s linear infinite;
`

const Stage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 0;
  width: 100%;
  padding: 0.4rem 0 0.6rem;
  overflow: hidden;
`

const WheelBox = styled.div<{ $spinning: boolean }>`
  /* 残り高さに収まる正方形。幅基準で決めるとボタンやタイトルに被る */
  flex: 1;
  min-height: 0;
  aspect-ratio: 1;
  max-width: min(92vw, 640px);
  animation: ${({ $spinning }) => ($spinning ? shake : 'none')} 0.18s infinite;

  canvas {
    width: 100%;
    height: 100%;
  }
`

const SpinButton = styled.button`
  padding: 0.6rem 2.4rem;
  border: none;
  border-radius: 999px;
  font-size: clamp(1rem, 3vw, 1.7rem);
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #12021f;
  cursor: pointer;
  background: linear-gradient(90deg, #ffd84d, #ff2fb3, #00e5ff);
  box-shadow: 0 0 30px rgba(255, 47, 179, 0.8);
  animation: ${pulse} 1.4s ease-in-out infinite;

  &:disabled {
    filter: grayscale(0.6);
    animation: none;
    cursor: default;
  }
`

const Hint = styled.div`
  font-size: 0.8rem;
  opacity: 0.6;
`

const Panel = styled.div<{ $open: boolean }>`
  width: 100%;
  max-width: 900px;
  background: rgba(10, 0, 22, 0.85);
  border-top: 2px solid rgba(255, 47, 179, 0.6);
  transition: max-height 0.25s ease;
  max-height: ${({ $open }) => ($open ? '38vh' : '2.4rem')};
  overflow: hidden;
`

const PanelToggle = styled.button`
  width: 100%;
  height: 2.4rem;
  border: none;
  background: transparent;
  color: #ffd84d;
  font-weight: 700;
  cursor: pointer;
`

const PanelBody = styled.div`
  display: flex;
  gap: 0.8rem;
  padding: 0 0.8rem 0.8rem;
`

const TextArea = styled.textarea`
  flex: 2;
  height: 26vh;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-size: 0.95rem;
  resize: none;
`

const PanelSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  overflow: hidden;
`

const History = styled.ol`
  margin: 0;
  padding-left: 1.2rem;
  overflow-y: auto;
  opacity: 0.75;
`

const Result = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(10, 0, 22, 0.82);
  cursor: pointer;
`

const ResultLabel = styled.div`
  font-size: clamp(1rem, 3vw, 2rem);
  letter-spacing: 0.5em;
  color: #ffd84d;
`

const ResultName = styled.div`
  max-width: 92vw;
  text-align: center;
  font-size: clamp(2.4rem, 12vw, 9rem);
  font-weight: 900;
  line-height: 1.1;
  background: linear-gradient(90deg, #ffd84d, #ff2fb3, #00e5ff, #ffd84d);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${pop} 0.45s cubic-bezier(0.2, 1.4, 0.4, 1), ${hueShift} 4s linear infinite;
`

const ResultClose = styled.div`
  opacity: 0.6;
  font-size: 0.9rem;
`

export default Roulette
