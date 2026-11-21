import Head from 'next/head'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import {
  GrayCodeStrip,
  paintGrayCode,
} from '../components/ScopeTimer/GrayCodeStrip'
import { FpsModal } from '../components/ScopeTimer/FpsModal'
import { DelayModal } from '../components/ScopeTimer/DelayModal'
import { ThemeModal } from '../components/ScopeTimer/ThemeModal'
import { THEMES } from '../components/ScopeTimer/themes'
import type { Theme, ThemeKey } from '../components/ScopeTimer/themes'
import { useDisplayRefreshRate } from '../components/ScopeTimer/useDisplayRefreshRate'

// 設定定数
const CONFIG = {
  MARGIN_PERCENT: 2,
  // 単位は vmin: 縦横どちらの向きでも短辺基準で同じ太さ・余白にするため
  BAR_THICKNESS: 1,
  // 画面端に貼り付くと撮影時にベゼルや画角の端で欠けるため内側に寄せる
  BAR_OFFSET: 1.6,
  SCALE_DIVISIONS: 10,
  SCALE_WIDTH: 0.3,
  SCALE_LENGTH: 3,
  DATE_FONT_SIZE: 'clamp(0.8rem, 3vw, 3rem)',
  MAIN_TIME_FONT_SIZE: 'clamp(1.5rem, 6vw, 8rem)',
  MAIN_TIME_UNIT_FONT_SIZE: 'clamp(0.5rem, 2vw, 2.5rem)',
  SECOND_MS_FONT_SIZE: 'clamp(3rem, 15vw, 25rem)',
  SECOND_MS_UNIT_FONT_SIZE: 'clamp(1rem, 4vw, 8rem)',
  SUB_MS_FONT_SIZE: 'clamp(1rem, 4vw, 6rem)',
  SUB_MS_UNIT_FONT_SIZE: 'clamp(0.4rem, 1.5vw, 2rem)',
  DATE_OPACITY: 0.7,
  TIME_OPACITY: 0.8,
  DEFAULT_THEME: 'blackOnWhite' as const,
  UPDATE_FPS: 15, // カメラ撮影時の残像を減らすため30FPSに制限
} as const

// 目盛りの中心をバーの中心線に合わせるための、枠からのずらし量 (vmin)
const SCALE_CROSS_SHIFT = (CONFIG.BAR_THICKNESS - CONFIG.SCALE_LENGTH) / 2

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

// カスタムフック: アニメーションループ管理（FPS制限付き）
function useAnimationLoop(callback: (frameTime: number) => void, fps: number) {
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
        callbackRef.current(currentTime)
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

// カスタムフック: 毎描画フレームの更新 (プログレスバー・フレーム番号・グレイコード)
// 時刻は rAF の引数 (そのフレームの描画開始時刻) を使う。performance.now() だと実際に画面に出る時刻から数 ms ずれる
function useProgressBars(
  startTimeRef: MutableRefObject<number>,
  startPerfRef: MutableRefObject<number>
) {
  const topBarRef = useRef<HTMLDivElement>(null)
  const leftBarRef = useRef<HTMLDivElement>(null)
  const grayStripRef = useRef<HTMLDivElement>(null)
  const frameCountRef = useRef(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    const animate = (frameTime: number) => {
      frameCountRef.current += 1
      const elapsed = frameTime - startPerfRef.current
      const now = startTimeRef.current + elapsed
      const progress = (now % 1000) / 1000

      if (topBarRef.current) {
        topBarRef.current.style.width = `${progress * 100}%`
      }
      if (leftBarRef.current) {
        leftBarRef.current.style.height = `${progress * 100}%`
      }
      if (grayStripRef.current) {
        paintGrayCode(grayStripRef.current, frameCountRef.current)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [startTimeRef, startPerfRef])

  return { topBarRef, leftBarRef, grayStripRef, frameCountRef }
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
  const isHorizontal = orientation === 'horizontal'

  // 線の中心を目盛り位置に置く (端基準だと 0% と 100% で線がバーの内外にずれる)
  return (
    <>
      {marks.map((i) => {
        const pos = `${(i / CONFIG.SCALE_DIVISIONS) * 100}%`

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: isHorizontal ? 0 : pos,
              left: isHorizontal ? pos : 0,
              width: `${isHorizontal ? CONFIG.SCALE_WIDTH : CONFIG.SCALE_LENGTH}vmin`,
              height: `${isHorizontal ? CONFIG.SCALE_LENGTH : CONFIG.SCALE_WIDTH}vmin`,
              transform: isHorizontal ? 'translateX(-50%)' : 'translateY(-50%)',
              backgroundColor: theme.SCALE_COLOR,
            }}
          />
        )
      })}
    </>
  )
}

const ScopeTimer = () => {
  const [currentTime, setCurrentTime] = useState(0)
  const [theme, setTheme] = useState<ThemeKey>(CONFIG.DEFAULT_THEME)
  const [fps, setFps] = useState<number>(CONFIG.UPDATE_FPS)
  const [mounted, setMounted] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [isFpsModalOpen, setIsFpsModalOpen] = useState(false)
  const refreshHz = useDisplayRefreshRate()
  const startTimeRef = useRef(0)
  const startPerfRef = useRef(0)
  const [frameNumber, setFrameNumber] = useState(0)
  const { topBarRef, leftBarRef, grayStripRef, frameCountRef } =
    useProgressBars(startTimeRef, startPerfRef)

  useEffect(() => {
    startTimeRef.current = Date.now()
    startPerfRef.current = performance.now()
    setCurrentTime(startTimeRef.current)
    setMounted(true)
  }, [])

  useAnimationLoop((frameTime) => {
    // そのフレームの描画開始時刻 (rAF の引数) を起点時刻に加算
    const now = startTimeRef.current + (frameTime - startPerfRef.current)

    setCurrentTime(now)
    setFrameNumber(frameCountRef.current)
  }, fps)

  const currentTheme = THEMES[theme]
  const { dateStr, hours, minutes, seconds, milliseconds, subMilliseconds } =
    formatTimeData(currentTime)

  const closeThemeModal = useCallback(() => setIsThemeModalOpen(false), [])
  const closeDelayModal = useCallback(() => setIsDelayModalOpen(false), [])
  const closeFpsModal = useCallback(() => setIsFpsModalOpen(false), [])

  // SSRハイドレーションエラーを防ぐため、マウント前は表示しない
  if (!mounted) {
    return null
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
        {/* プログレスバーとスケール: BAR_OFFSET だけ内側の枠を基準に配置 */}
        <div
          style={{
            position: 'absolute',
            inset: `${CONFIG.BAR_OFFSET}vmin`,
            pointerEvents: 'none',
          }}
        >
          {/* 上端プログレスバー */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: `${CONFIG.BAR_THICKNESS}vmin`,
              backgroundColor: currentTheme.BAR_COLOR,
              borderRadius: `${CONFIG.BAR_THICKNESS / 2}vmin`,
            }}
            ref={topBarRef}
          />

          {/* 上端スケール */}
          {/* 目盛りはバーの中心線で交差させる。進行方向は枠と同じなので 0〜100% の位置がバーと揃う */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              top: `${SCALE_CROSS_SHIFT}vmin`,
            }}
          >
            <ScaleMarks orientation="horizontal" theme={currentTheme} />
          </div>

          {/* 左端プログレスバー */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${CONFIG.BAR_THICKNESS}vmin`,
              backgroundColor: currentTheme.BAR_COLOR,
              borderRadius: `${CONFIG.BAR_THICKNESS / 2}vmin`,
            }}
            ref={leftBarRef}
          />

          {/* 左端スケール */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              left: `${SCALE_CROSS_SHIFT}vmin`,
            }}
          >
            <ScaleMarks orientation="vertical" theme={currentTheme} />
          </div>
        </div>

        {/* コンテンツエリア */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: `calc(${CONFIG.MARGIN_PERCENT}% + ${CONFIG.BAR_OFFSET + CONFIG.BAR_THICKNESS / 2 + CONFIG.SCALE_LENGTH / 2}vmin)`,
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
                  textShadow: currentTheme.HAS_GLOW
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

            {/* 描画フレーム番号: グレイコードは毎フレーム、数字は UPDATE_FPS で更新 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1vmin',
                fontFamily: 'monospace',
                fontVariantNumeric: 'tabular-nums',
                fontSize: CONFIG.DATE_FONT_SIZE,
              }}
            >
              <GrayCodeStrip stripRef={grayStripRef} />
              <span style={{ opacity: CONFIG.DATE_OPACITY }}>
                F{String(frameNumber).padStart(6, '0')}
                {refreshHz !== null &&
                  ` · ${(1000 / refreshHz).toFixed(2)}ms/F`}
              </span>
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
              {/* テーマ選択 */}
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                aria-haspopup="dialog"
                style={{
                  padding:
                    'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
                  background: 'transparent',
                  color: currentTheme.TEXT_COLOR,
                  border: `2px solid ${currentTheme.TEXT_COLOR}`,
                  borderRadius: '4px',
                  font: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentTheme.LABEL}
              </button>

              {/* 遅延計算: 写真のブロック列 2 つを写し取ってフレーム差を出す */}
              <button
                type="button"
                onClick={() => setIsDelayModalOpen(true)}
                aria-haspopup="dialog"
                style={{
                  padding:
                    'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
                  background: 'transparent',
                  color: currentTheme.TEXT_COLOR,
                  border: `2px solid ${currentTheme.TEXT_COLOR}`,
                  borderRadius: '4px',
                  font: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Delay
              </button>

              {/* FPS 選択: 表示環境のリフレッシュレートを超える値はモーダル内で disabled */}
              <button
                type="button"
                onClick={() => setIsFpsModalOpen(true)}
                aria-haspopup="dialog"
                style={{
                  padding:
                    'clamp(0.3rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 1rem)',
                  background: 'transparent',
                  color: currentTheme.TEXT_COLOR,
                  border: `2px solid ${currentTheme.TEXT_COLOR}`,
                  borderRadius: '4px',
                  font: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {fps}fps
              </button>
            </div>
          </div>
        </div>
        <ThemeModal
          isOpen={isThemeModalOpen}
          value={theme}
          onSelect={(key) => {
            setTheme(key)
            setIsThemeModalOpen(false)
          }}
          onClose={closeThemeModal}
          theme={currentTheme}
        />
        <FpsModal
          isOpen={isFpsModalOpen}
          value={fps}
          onSelect={(option) => {
            setFps(option)
            setIsFpsModalOpen(false)
          }}
          onClose={closeFpsModal}
          theme={currentTheme}
          refreshHz={refreshHz}
        />
        <DelayModal
          isOpen={isDelayModalOpen}
          onClose={closeDelayModal}
          theme={currentTheme}
          frameMs={refreshHz === null ? null : 1000 / refreshHz}
        />
      </div>
    </>
  )
}

export default ScopeTimer
