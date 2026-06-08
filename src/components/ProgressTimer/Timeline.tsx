import { useRef } from 'react'
import styled from 'styled-components'
import {
  formatClock,
  formatClockSec,
  formatCumulative,
  formatDuration,
} from '../../lib/progress-timer'
import type { ProgressTimerApi } from './useProgressTimer'

const COLORS = [
  '#4080ff',
  '#27ae60',
  '#e67e22',
  '#9b59b6',
  '#16a085',
  '#e74c3c',
  '#f39c12',
  '#2c3e50',
]
export const colorOf = (i: number): string => COLORS[i % COLORS.length]
export const stepLabel = (name: string, i: number): string =>
  name || String.fromCharCode(65 + (i % 26))
const pct = (v: number, total: number): number =>
  total <= 0 ? 0 : (v / total) * 100

/** 境界ラベルを互い違い(上下2段)に配置し、両端は内側寄せで見切れを防ぐ。 */
const tickStyle = (
  leftPct: number,
  b: number,
  count: number
): React.CSSProperties => ({
  left: `${leftPct}%`,
  top: b % 2 === 0 ? 0 : 14,
  transform:
    b === 0
      ? 'translateX(0)'
      : b === count
        ? 'translateX(-100%)'
        : 'translateX(-50%)',
})

type Props = { t: ProgressTimerApi }

export function Timeline({ t }: Props) {
  const { planRows, actualRows, totalMin, curIndex, progress, started } = t
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ b: number; lastX: number; pxPerMin: number } | null>(
    null
  )

  if (totalMin <= 0 || planRows.length === 0) {
    return <Empty>配分を入力すると帯で表示されます</Empty>
  }

  const n = planRows.length
  const planAbsAt = (b: number): number =>
    b < n ? planRows[b].absStartMin : planRows[n - 1].absEndMin
  const planCumAt = (b: number): number =>
    b < n ? planRows[b].cumStartMin : totalMin

  // --- 実績バー ---
  const actStart0 = actualRows[0]?.actualStartMin ?? 0
  const actEndLast = actualRows[n - 1]?.actualEndMin ?? 0
  const actSpan = Math.max(1, actEndLast - actStart0)
  const actAbsAt = (b: number): number =>
    b < n ? (actualRows[b]?.actualStartMin ?? 0) : actEndLast
  const playheadPct =
    progress && curIndex !== null ? pct(t.nowMin - actStart0, actSpan) : null

  const onHandleDown = (b: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    const width = trackRef.current?.getBoundingClientRect().width ?? 1
    drag.current = { b, lastX: e.clientX, pxPerMin: width / actSpan }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onHandleMove = (e: React.PointerEvent) => {
    const ds = drag.current

    if (!ds) return
    const dMin = Math.round((e.clientX - ds.lastX) / ds.pxPerMin)

    if (dMin !== 0) {
      t.shift(ds.b, dMin)
      ds.lastX += dMin * ds.pxPerMin
    }
  }
  const onHandleUp = () => {
    drag.current = null
  }

  return (
    <Wrap>
      {/* 予定バー */}
      <Lane>
        <LaneLabel>予定</LaneLabel>
        <Axis>
          {Array.from({ length: n + 1 }, (_, b) => (
            <Tick key={b} style={tickStyle(pct(planCumAt(b), totalMin), b, n)}>
              {formatClock(planAbsAt(b))}
            </Tick>
          ))}
        </Axis>
        <Bar>
          {planRows.map((row, i) => (
            <Seg
              key={t.plan.steps[i].id}
              title={`${stepLabel(row.name, i)} ${formatDuration(row.durationMin)}`}
              style={{
                left: `${pct(row.cumStartMin, totalMin)}%`,
                width: `${pct(row.durationMin, totalMin)}%`,
                background: `${colorOf(i)}26`,
                borderColor: colorOf(i),
              }}
              $current={curIndex === i}
            >
              <span className="name">{stepLabel(row.name, i)}</span>
              <span className="dur">{formatDuration(row.durationMin)}</span>
            </Seg>
          ))}
        </Bar>
        <Axis className="cum">
          {Array.from({ length: n + 1 }, (_, b) => (
            <Tick key={b} style={tickStyle(pct(planCumAt(b), totalMin), b, n)}>
              {formatCumulative(planCumAt(b))}
            </Tick>
          ))}
        </Axis>
      </Lane>

      {/* 実績バー (開始後のみ・予定とは別) */}
      {started && (
        <Lane>
          <LaneLabel className="actual">実績</LaneLabel>
          <Bar ref={trackRef}>
            {actualRows.map((ar, i) => {
              const w = Math.max(0, ar.actualEndMin - ar.actualStartMin)

              return (
                <Seg
                  key={t.plan.steps[i].id}
                  style={{
                    left: `${pct(ar.actualStartMin - actStart0, actSpan)}%`,
                    width: `${pct(w, actSpan)}%`,
                    background: `${colorOf(i)}1f`,
                    borderColor: colorOf(i),
                  }}
                  $current={curIndex === i}
                >
                  {curIndex === i && progress && (
                    <Fill style={{ width: `${progress.ratio * 100}%` }} />
                  )}
                  <span className="name">{stepLabel(planRows[i].name, i)}</span>
                </Seg>
              )
            })}

            {/* 境界の左右調整ハンドル (内部境界 1..n-1) */}
            {Array.from({ length: n - 1 }, (_, k) => {
              const b = k + 1

              return (
                <Handle
                  key={b}
                  style={{ left: `${pct(actAbsAt(b) - actStart0, actSpan)}%` }}
                  title="ドラッグで境界を左右に調整"
                  onPointerDown={onHandleDown(b)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                >
                  <span className="grip">⇆</span>
                </Handle>
              )
            })}

            {/* 再生ヘッド (現在時刻) */}
            {playheadPct !== null && playheadPct >= 0 && playheadPct <= 100 && (
              <Playhead style={{ left: `${playheadPct}%` }}>
                <span className="t">{formatClockSec(t.nowMin)}</span>
              </Playhead>
            )}
          </Bar>
          <Axis className="cum">
            {Array.from({ length: n + 1 }, (_, b) => {
              const a = actAbsAt(b)
              const p = planAbsAt(b)

              return (
                <Tick
                  key={b}
                  className={Math.round(a) !== p ? 'diff' : ''}
                  style={tickStyle(pct(actAbsAt(b) - actStart0, actSpan), b, n)}
                >
                  {formatClock(Math.round(a))}
                </Tick>
              )
            })}
          </Axis>
        </Lane>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  margin-bottom: 24px;
`

const Empty = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  text-align: center;
  color: #999;
  border: 1px dashed #ddd;
  border-radius: 8px;
`

const Lane = styled.div`
  position: relative;
  margin: 28px 0 8px;
  padding: 0 8px;
`

const LaneLabel = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 2px;

  &.actual {
    color: #c0392b;
  }
`

const Axis = styled.div`
  position: relative;
  height: 30px;

  &.cum {
    color: #aaa;
  }
`

const Tick = styled.span`
  position: absolute;
  font-size: 0.72rem;
  color: #777;
  white-space: nowrap;

  &.diff {
    color: #c0392b;
    font-weight: 600;
  }
`

const Bar = styled.div`
  position: relative;
  height: 44px;
  margin: 2px 0;
`

const Seg = styled.div<{ $current: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0 2px 0 8px;
  border: 1px solid;
  border-radius: 6px;
  box-sizing: border-box;
  box-shadow: ${(p) => (p.$current ? '0 0 0 2px #4080ff inset' : 'none')};

  /* 名前のみ端で見切れて fade out (省略記号でなくスーッと消す) */
  .name {
    max-width: 100%;
    white-space: nowrap;
    z-index: 1;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.15;
    -webkit-mask-image: linear-gradient(
      to right,
      #000 calc(100% - 12px),
      transparent
    );
    mask-image: linear-gradient(to right, #000 calc(100% - 12px), transparent);
  }
  /* 配分は短いので常にフル表示 (fade しない) */
  .dur {
    z-index: 1;
    white-space: nowrap;
    font-size: 0.72rem;
    color: #555;
  }
`

const Fill = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #4080ff33;
`

const Handle = styled.div`
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  touch-action: none;
  z-index: 3;

  .grip {
    font-size: 0.8rem;
    color: #fff;
    background: #c0392b;
    border-radius: 4px;
    padding: 2px 1px;
    line-height: 1;
    box-shadow: 0 1px 3px #0003;
  }
  &:hover .grip {
    background: #e74c3c;
  }
`

const Playhead = styled.div`
  position: absolute;
  top: -6px;
  bottom: -6px;
  width: 2px;
  background: #111;
  z-index: 2;

  .t {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    background: #111;
    color: #fff;
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;
  }
`
