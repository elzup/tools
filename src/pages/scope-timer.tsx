import { useEffect, useRef, useState } from 'react'

const title = 'Scope Timer'

const ScopeTimer = () => {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const animationRef = useRef<number>()
  const topBarRef = useRef<HTMLDivElement>(null)
  const rightBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animate = () => {
      const now = performance.now()
      setCurrentTime(now)

      // プログレスバーアニメーション（1秒周期）
      const progress = (now % 1000) / 1000

      if (topBarRef.current) {
        topBarRef.current.style.width = `${(1 - progress) * 100}%`
      }
      if (rightBarRef.current) {
        rightBarRef.current.style.height = `${progress * 100}%`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const date = new Date(currentTime)
  const milliseconds = currentTime % 1000
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = milliseconds.toFixed(3).padStart(7, '0')

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
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
          height: '4px',
          backgroundColor: '#0f0',
          transition: 'none',
        }}
        ref={topBarRef}
      />

      {/* 右端プログレスバー */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          backgroundColor: '#0f0',
          transition: 'none',
        }}
        ref={rightBarRef}
      />

      {/* コンテンツエリア */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10%',
        }}
      >
        {/* 小さい日付表示 */}
        <div
          style={{
            fontSize: '1rem',
            marginBottom: '2rem',
            opacity: 0.6,
            fontFamily: 'monospace',
          }}
        >
          {dateStr}
        </div>

        {/* 巨大ミリ秒表示 */}
        <div
          style={{
            fontSize: 'clamp(4rem, 15vw, 20rem)',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            textShadow:
              '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #0f0, 2px 2px 4px #000',
            letterSpacing: '0.1em',
            lineHeight: 1,
          }}
        >
          {ms}
        </div>

        {/* 副表示: 時:分:秒 */}
        <div
          style={{
            fontSize: 'clamp(1.5rem, 5vw, 4rem)',
            marginTop: '2rem',
            fontFamily: 'monospace',
            fontVariantNumeric: 'tabular-nums',
            opacity: 0.8,
          }}
        >
          {hours}:{minutes}:{seconds}
        </div>
      </div>
    </div>
  )
}

export default ScopeTimer
