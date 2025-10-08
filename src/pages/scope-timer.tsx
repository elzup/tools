import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'

// カラーテーマ定義
type Theme = {
  BG_COLOR: string
  TEXT_COLOR: string
  BAR_COLOR: string
  SCALE_COLOR: string
}

const THEMES: Record<string, Theme> = {
  whiteOnBlack: {
    BG_COLOR: '#000',
    TEXT_COLOR: '#fff',
    BAR_COLOR: '#ff4040',
    SCALE_COLOR: '#ff4040',
  },
  blackOnWhite: {
    BG_COLOR: '#fff',
    TEXT_COLOR: '#000',
    BAR_COLOR: '#4080ff',
    SCALE_COLOR: '#4080ff',
  },
  greenMatrix: {
    BG_COLOR: '#000',
    TEXT_COLOR: '#0f0',
    BAR_COLOR: '#0f0',
    SCALE_COLOR: '#0f0',
  },
}

// 設定定数
const CONFIG = {
  MARGIN_PERCENT: 2,
  BAR_THICKNESS: 4,
  BAR_OFFSET: 2,
  SCALE_DIVISIONS: 10,
  SCALE_WIDTH: 2,
  SCALE_LENGTH: 10,
  DATE_FONT_SIZE: 'clamp(0.8rem, 3vw, 3rem)',
  MAIN_TIME_FONT_SIZE: 'clamp(1.5rem, 6vw, 8rem)',
  MAIN_TIME_UNIT_FONT_SIZE: 'clamp(0.5rem, 2vw, 2.5rem)',
  SECOND_MS_FONT_SIZE: 'clamp(3rem, 15vw, 25rem)',
  SECOND_MS_UNIT_FONT_SIZE: 'clamp(1rem, 4vw, 8rem)',
  SUB_MS_FONT_SIZE: 'clamp(1rem, 4vw, 6rem)',
  SUB_MS_UNIT_FONT_SIZE: 'clamp(0.4rem, 1.5vw, 2rem)',
  DATE_OPACITY: 0.7,
  TIME_OPACITY: 0.8,
  DEFAULT_THEME: 'whiteOnBlack' as const,
  UPDATE_FPS: 30, // カメラ撮影時の残像を減らすため30FPSに制限
} as const

// 型定義
type TimeData = {
  dateStr: string
  hours: string
  minutes: string
  seconds: string
  milliseconds: string
  subMilliseconds: string
}

// 純関数: 現在時刻から表示用データを生成
function formatTimeData(timestamp: number): TimeData {
  const date = new Date(Math.floor(timestamp))
  const ms = timestamp % 1000
  const msStr = ms.toFixed(3).padStart(7, '0')

  return {
    dateStr: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`,
    hours: String(date.getHours()).padStart(2, '0'),
    minutes: String(date.getMinutes()).padStart(2, '0'),
    seconds: String(date.getSeconds()).padStart(2, '0'),
    milliseconds: msStr.substring(0, 3), // 最初の3桁
    subMilliseconds: msStr.substring(4, 5), // 小数点以下1桁目
  }
}

// 純関数: プログレスバーの進捗率を計算
function calculateProgress(timestamp: number): number {
  return (timestamp % 1000) / 1000
}

// カスタムフック: アニメーションループ管理（FPS制限付き）
function useAnimationLoop(callback: () => void, fps: number) {
  const animationRef = useRef<number>()
  const callbackRef = useRef(callback)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const frameInterval = 1000 / fps

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTimeRef.current

      if (elapsed >= frameInterval) {
        callbackRef.current()
        lastTimeRef.current = currentTime - (elapsed % frameInterval)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fps])
}

// カスタムフック: プログレスバーの更新
function useProgressBars() {
  const topBarRef = useRef<HTMLDivElement>(null)
  const leftBarRef = useRef<HTMLDivElement>(null)

  const updateProgress = (progress: number) => {
    if (topBarRef.current) {
      topBarRef.current.style.width = `${progress * 100}%`
    }
    if (leftBarRef.current) {
      leftBarRef.current.style.height = `${progress * 100}%`
    }
  }

  return { topBarRef, leftBarRef, updateProgress }
}

// コンポーネント: スケールマーク
function ScaleMarks({
  orientation,
  theme,
}: {
  orientation: 'horizontal' | 'vertical'
  theme: Theme
}) {
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
              backgroundColor: theme.SCALE_COLOR,
            }}
          />
        ))}
      </>
    )
  }

  return (
    <>
      {marks.slice(1).map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i / CONFIG.SCALE_DIVISIONS) * 100}%`,
            left: 0,
            width: `${CONFIG.SCALE_LENGTH}px`,
            height: `${CONFIG.SCALE_WIDTH}px`,
            backgroundColor: theme.SCALE_COLOR,
          }}
        />
      ))}
    </>
  )
}

const ScopeTimer = () => {
  const [currentTime, setCurrentTime] = useState(0)
  const [theme, setTheme] = useState<keyof typeof THEMES>(CONFIG.DEFAULT_THEME)
  const [fps, setFps] = useState<number>(CONFIG.UPDATE_FPS)
  const [mounted, setMounted] = useState(false)
  const { topBarRef, leftBarRef, updateProgress } = useProgressBars()
  const startTimeRef = useRef(0)
  const startPerfRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    startPerfRef.current = performance.now()
    setCurrentTime(startTimeRef.current)
    setMounted(true)
  }, [])

  useAnimationLoop(() => {
    // performance.now() を使って高精度な経過時間を計算し、起点時刻に加算
    const elapsed = performance.now() - startPerfRef.current
    const now = startTimeRef.current + elapsed
    setCurrentTime(now)
    updateProgress(calculateProgress(now))
  }, fps)

  const currentTheme = THEMES[theme]
  const { dateStr, hours, minutes, seconds, milliseconds, subMilliseconds } =
    formatTimeData(currentTime)

  // SSRハイドレーションエラーを防ぐため、マウント前は表示しない
  if (!mounted) {
    return null
  }

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES) as Array<keyof typeof THEMES>
    const currentIndex = themeKeys.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setTheme(themeKeys[nextIndex])
  }

  const cycleFps = () => {
    const fpsOptions = [15, 24, 30, 60]
    const currentIndex = fpsOptions.indexOf(fps)
    const nextIndex = (currentIndex + 1) % fpsOptions.length
    setFps(fpsOptions[nextIndex])
  }

  const getThemeName = () => {
    const names = {
      whiteOnBlack: 'W/B',
      blackOnWhite: 'B/W',
      greenMatrix: 'GRN',
    }
    return names[theme] ?? 'N/A'
  }

  return (
    <>
      <Head>
        <title>Scope Timer - 高精度ミリ秒タイマー</title>
        <meta
          name="description"
          content="ミリ秒タイマー・時計ツール。カメラ撮影実験用の高精度タイマー"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: currentTheme.BG_COLOR,
          color: currentTheme.TEXT_COLOR,
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
            top: `${CONFIG.BAR_OFFSET}px`,
            left: `${CONFIG.BAR_OFFSET}px`,
            height: `${CONFIG.BAR_THICKNESS}px`,
            backgroundColor: currentTheme.BAR_COLOR,
            transition: 'none',
            borderRadius: `${CONFIG.BAR_THICKNESS / 2}px`,
          }}
          ref={topBarRef}
        />

        {/* 上端スケール */}
        <ScaleMarks orientation="horizontal" theme={currentTheme} />

        {/* 左端プログレスバー */}
        <div
          style={{
            position: 'absolute',
            top: `${CONFIG.BAR_OFFSET}px`,
            left: `${CONFIG.BAR_OFFSET}px`,
            width: `${CONFIG.BAR_THICKNESS}px`,
            backgroundColor: currentTheme.BAR_COLOR,
            transition: 'none',
            borderRadius: `${CONFIG.BAR_THICKNESS / 2}px`,
          }}
          ref={leftBarRef}
        />

        {/* 左端スケール */}
        <ScaleMarks orientation="vertical" theme={currentTheme} />

        {/* コンテンツエリア */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `${CONFIG.MARGIN_PERCENT}%`,
          }}
        >
          {/* 中央コンテンツ */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
            }}
          >
            {/* 時刻表示: HH:MM:SS.xxx */}
            <div
              style={{
                fontSize: CONFIG.MAIN_TIME_FONT_SIZE,
                fontFamily: 'monospace',
                fontVariantNumeric: 'tabular-nums',
                opacity: CONFIG.TIME_OPACITY,
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: 1,
                gap: '0.5ch',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{hours}</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    h
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>:</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    _
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{minutes}</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    m
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>:</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    _
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{seconds}</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    s
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>.</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    _
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{milliseconds}</span>
                  <span
                    style={{
                      fontSize: CONFIG.MAIN_TIME_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    ms
                  </span>
                </div>
              </div>

              {/* サブミリ秒表示 */}
              <div
                style={{
                  fontSize: `calc(${CONFIG.MAIN_TIME_FONT_SIZE} * 0.8)`,
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  lineHeight: 1,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>.</span>
                  <span
                    style={{
                      fontSize: `calc(${CONFIG.MAIN_TIME_UNIT_FONT_SIZE} * 0.8)`,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    _
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{subMilliseconds}0</span>
                  <span
                    style={{
                      fontSize: `calc(${CONFIG.MAIN_TIME_UNIT_FONT_SIZE} * 0.8)`,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    μs
                  </span>
                </div>
              </div>
            </div>

            {/* 巨大秒.ミリ秒表示 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: CONFIG.SECOND_MS_FONT_SIZE,
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow:
                    currentTheme.TEXT_COLOR === '#0f0'
                      ? '0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 2px 2px 4px #000'
                      : 'none',
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{seconds}</span>
                  <span
                    style={{
                      fontSize: CONFIG.SECOND_MS_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    s
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>.</span>
                  <span
                    style={{
                      fontSize: CONFIG.SECOND_MS_UNIT_FONT_SIZE,
                      opacity: 0,
                      lineHeight: 1,
                    }}
                  >
                    _
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <span>{milliseconds}</span>
                  <span
                    style={{
                      fontSize: CONFIG.SECOND_MS_UNIT_FONT_SIZE,
                      opacity: 0.6,
                      lineHeight: 1,
                    }}
                  >
                    ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* 日付表示（左下） */}
            <div
              style={{
                fontSize: CONFIG.DATE_FONT_SIZE,
                opacity: CONFIG.DATE_OPACITY,
                fontFamily: 'monospace',
                minWidth: 'fit-content',
              }}
            >
              {dateStr}
            </div>

            {/* コントロールボタン（右下） */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                fontSize: CONFIG.DATE_FONT_SIZE,
                fontFamily: 'monospace',
                flexShrink: 0,
              }}
            >
              {/* テーマ切り替えボタン */}
              <div
                onClick={cycleTheme}
                style={{
                  padding:
                    'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
                  border: `2px solid ${currentTheme.TEXT_COLOR}`,
                  borderRadius: '4px',
                  opacity: 0.7,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                {getThemeName()}
              </div>

              {/* FPS切り替えボタン */}
              <div
                onClick={cycleFps}
                style={{
                  padding:
                    'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
                  border: `2px solid ${currentTheme.TEXT_COLOR}`,
                  borderRadius: '4px',
                  opacity: 0.7,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                {fps}fps
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScopeTimer
