import styled from 'styled-components'
import {
  formatClock,
  formatCumulative,
  formatDuration,
} from '../../lib/progress-timer'
import { colorOf, stepLabel } from './Timeline'
import type { ProgressTimerApi } from './useProgressTimer'

type Props = { t: ProgressTimerApi }

/**
 * timeline 下の縦方向リスト。長いラベルをフル表示する読み取り用ビュー。
 * ステップ数が多い/名前が長いアジェンダでも一覧で追える。
 */
export function VerticalList({ t }: Props) {
  const { planRows, actualRows, curIndex, progress, started } = t

  if (planRows.length === 0) return null

  return (
    <List>
      {planRows.map((row) => {
        const i = row.index
        const isCurrent = curIndex === i
        const actual = actualRows[i]

        return (
          <Item key={t.plan.steps[i].id} $current={isCurrent}>
            <Time>
              <span className="abs">{formatClock(row.absStartMin)}</span>
              <span className="cum">{formatCumulative(row.cumStartMin)}</span>
            </Time>
            <Rail>
              <Dot style={{ background: colorOf(i) }} $current={isCurrent} />
            </Rail>
            <Body>
              <div className="head">
                <span className="name">{stepLabel(row.name, i)}</span>
                <span className="dur" style={{ color: colorOf(i) }}>
                  {formatDuration(row.durationMin)}
                </span>
              </div>
              {started && actual && (
                <div className="actual">
                  実績 {formatClock(Math.round(actual.actualStartMin))} →{' '}
                  {formatClock(Math.round(actual.actualEndMin))}
                </div>
              )}
              {isCurrent && progress && (
                <>
                  <MiniBar>
                    <MiniFill
                      style={{
                        width: `${progress.ratio * 100}%`,
                        background: colorOf(i),
                      }}
                    />
                  </MiniBar>
                  <div className="remain">
                    残り{' '}
                    {formatCumulative(
                      Math.max(0, Math.ceil(progress.remainMin))
                    )}
                  </div>
                </>
              )}
            </Body>
          </Item>
        )
      })}
    </List>
  )
}

const List = styled.div`
  margin: 8px 0 16px;
`

const Item = styled.div<{ $current: boolean }>`
  display: grid;
  grid-template-columns: 52px 18px 1fr;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: ${(p) => (p.$current ? '#4080ff12' : 'transparent')};
`

const Time = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
  padding-top: 1px;

  .abs {
    font-size: 0.9rem;
    font-weight: 600;
  }
  .cum {
    font-size: 0.68rem;
    color: #aaa;
  }
`

const Rail = styled.div`
  position: relative;
  display: flex;
  justify-content: center;

  /* 縦の連結線 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: -12px;
    width: 2px;
    background: #eee;
  }
`

const Dot = styled.div<{ $current: boolean }>`
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border-radius: 50%;
  box-shadow: ${(p) => (p.$current ? '0 0 0 4px #4080ff44' : 'none')};
`

const Body = styled.div`
  min-width: 0;

  .head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
  }
  .name {
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }
  .dur {
    flex: none;
    font-size: 0.85rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .actual {
    font-size: 0.75rem;
    color: #c0392b;
    margin-top: 2px;
  }
  .remain {
    font-size: 0.75rem;
    color: #4080ff;
    margin-top: 2px;
  }
`

const MiniBar = styled.div`
  height: 5px;
  border-radius: 3px;
  background: #00000010;
  overflow: hidden;
  margin-top: 5px;
`

const MiniFill = styled.div`
  height: 100%;
`
