import { useEffect, useRef, useState } from 'react'

// 設定定数
const CONFIG = {
  MARGIN_PERCENT: 10,
  BAR_THICKNESS: 4,
  BAR_COLOR: '#0f0',
  SCALE_DIVISIONS: 10,
  SCALE_COLOR: '#0f0',
  SCALE_WIDTH: 2,
  SCALE_LENGTH: 20,
  BG_COLOR: '#000',
  TEXT_COLOR: '#fff',
  DATE_FONT_SIZE: 'clamp(1.5rem, 4vw, 3rem)',
  MS_FONT_SIZE: 'clamp(4rem, 15vw, 20rem)',
  TIME_FONT_SIZE: 'clamp(2rem, 6vw, 5rem)',
  DATE_OPACITY: 0.7,
  TIME_OPACITY: 0.8,
} as const

// 型定義
type TimeData = {
  dateStr: string
  hours: string
  minutes: string
  seconds: string
  milliseconds: string
}

// 純関数: 現在時刻から表示用データを生成
function formatTimeData(timestamp: number): TimeData {
  const date = new Date()
  const ms = timestamp % 1000

  return {
    dateStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    hours: String(date.getHours()).padStart(2, '0'),
    minutes: String(date.getMinutes()).padStart(2, '0'),
    seconds: String(date.getSeconds()).padStart(2, '0'),
    milliseconds: ms.toFixed(0).padStart(3, '0'),
  }
}

// 純関数: プログレスバーの進捗率を計算
function calculateProgress(timestamp: number): number {
  return (timestamp % 1000) / 1000
}

// カスタムフック: アニメーションループ管理
function useAnimationLoop(callback: (timestamp: number) => void) {
  const animationRef = useRef<number>()

  useEffect(() => {
    const animate = () => {
      const now = performance.now()
      callback(now)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [callback])
}

// カスタムフック: プログレスバーの更新
function useProgressBars() {
  const topBarRef = useRef<HTMLDivElement>(null)
  const leftBarRef = useRef<HTMLDivElement>(null)

  const updateProgress = (progress: number) => {
    if (topBarRef.current) {
      topBarRef.current.style.width = `${(1 - progress) * 100}%`
    }
    if (leftBarRef.current) {
      leftBarRef.current.style.height = `${progress * 100}%`
    }
  }

  return { topBarRef, leftBarRef, updateProgress }
}

// コンポーネント: スケールマーク
function ScaleMarks({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
  const marks = Array.from({ length: CONFIG.SCALE_DIVISIONS + 1 }, (_, i) => i)

  if (orientation === 'horizontal') {
    return (
      <>
        {marks.map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              right: `${(i / CONFIG.SCALE_DIVISIONS) * 100}%`,
              width: `${CONFIG.SCALE_WIDTH}px`,
              height: `${CONFIG.SCALE_LENGTH}px`,
              backgroundColor: CONFIG.SCALE_COLOR,
            }}
          />
        ))}
      </>
    )
  }

  return (
    <>
      {marks.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i / CONFIG.SCALE_DIVISIONS) * 100}%`,
            left: 0,
            width: `${CONFIG.SCALE_LENGTH}px`,
            height: `${CONFIG.SCALE_WIDTH}px`,
            backgroundColor: CONFIG.SCALE_COLOR,
          }}
        />
      ))}
    </>
  )
}

const ScopeTimer = () => {
  const [currentTime, setCurrentTime] = useState(0)
  const { topBarRef, leftBarRef, updateProgress } = useProgressBars()

  useAnimationLoop((timestamp) => {
    setCurrentTime(timestamp)
    updateProgress(calculateProgress(timestamp))
  })

  const { dateStr, hours, minutes, seconds, milliseconds } = formatTimeData(currentTime)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: CONFIG.BG_COLOR,
        color: CONFIG.TEXT_COLOR,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 上端プログレスバー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: `${CONFIG.BAR_THICKNESS}px`,
          backgroundColor: CONFIG.BAR_COLOR,
          transition: 'none',
        }}
        ref={topBarRef}
      />

      {/* 上端スケール */}
      <ScaleMarks orientation="horizontal" />

      {/* 左端プログレスバー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${CONFIG.BAR_THICKNESS}px`,
          backgroundColor: CONFIG.BAR_COLOR,
          transition: 'none',
        }}
        ref={leftBarRef}
      />

      {/* 左端スケール */}
      <ScaleMarks orientation="vertical" />

      {/* コンテンツエリア */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: `${CONFIG.MARGIN_PERCENT}%`,
        }}
      >
        {/* 日付表示 */}
        <div
          style={{
            fontSize: CONFIG.DATE_FONT_SIZE,
            marginBottom: '2rem',
            opacity: CONFIG.DATE_OPACITY,
            fontFamily: 'monospace',
          }}
        >
          {dateStr}
        </div>

        {/* 巨大ミリ秒表示 */}
        <div
          style={{
            fontSize: CONFIG.MS_FONT_SIZE,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #0f0, 2px 2px 4px #000',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          {milliseconds}
        </div>

        {/* 副表示: 時:分:秒 */}
        <div
          style={{
            fontSize: CONFIG.TIME_FONT_SIZE,
            marginTop: '2rem',
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            opacity: CONFIG.TIME_OPACITY,
          }}
        >
          {hours}:{minutes}:{seconds}
        </div>
      </div>
    </div>
  )
}

export default ScopeTimer
