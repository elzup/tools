import { Button } from '@mui/material'
import { useState } from 'react'
import styled from 'styled-components'
import {
  encodePlanText,
  formatClock,
  formatCumulative,
  formatDuration,
  parseClock,
  parseDuration,
} from '../../lib/progress-timer'
import { EditableText } from './EditableText'
import { Timeline } from './Timeline'
import { ProgressTimerApi, useProgressTimer } from './useProgressTimer'

type Mode = 'list' | 'text'

const ProgressTimer = () => {
  const t = useProgressTimer()
  const [mode, setMode] = useState<Mode>('list')
  const [copied, setCopied] = useState(false)

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(t.buildShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard 不可 */
    }
  }

  return (
    <Wrap>
      {/* 制御バー */}
      <Controls>
        <Field>
          <label>予定開始</label>
          <EditableText
            value={formatClock(t.plan.startClockMin)}
            parse={parseClock}
            onCommit={t.setStartClock}
            width={64}
          />
        </Field>
        <span className="now">現在 {formatClock(Math.floor(t.nowMin))}</span>
        <span className="total">
          合計 {formatCumulative(t.totalMin)} / 終了{' '}
          {formatClock(t.endClockMin)}
        </span>
        {!t.started ? (
          <Button variant="contained" size="small" onClick={t.start}>
            ▶ 開始
          </Button>
        ) : (
          <>
            <Field>
              <label>実績開始</label>
              <EditableText
                value={formatClock(
                  Math.round(t.actualRows[0]?.actualStartMin ?? 0)
                )}
                parse={parseClock}
                onCommit={t.customStart}
                width={64}
              />
            </Field>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              onClick={t.reset}
            >
              リセット
            </Button>
          </>
        )}
        <Button variant="outlined" size="small" onClick={copyShareUrl}>
          {copied ? 'コピー済' : 'URL共有'}
        </Button>
      </Controls>

      {/* 現在ステップの進捗 */}
      {t.progress && t.curIndex !== null && (
        <Now>
          <div className="head">
            <strong>
              {t.plan.steps[t.curIndex]?.name || `ステップ ${t.curIndex + 1}`}
            </strong>
            <span>
              経過 {formatCumulative(Math.floor(t.progress.elapsedMin))} / 残り{' '}
              {formatCumulative(Math.max(0, Math.ceil(t.progress.remainMin)))}
            </span>
          </div>
          <Track>
            <TrackFill style={{ width: `${t.progress.ratio * 100}%` }} />
          </Track>
        </Now>
      )}

      {/* 横タイムライン (予定 + 実績) */}
      <Timeline t={t} />

      {/* 編集モード切替 */}
      <ModeBar>
        <ModeButton $active={mode === 'list'} onClick={() => setMode('list')}>
          リスト編集
        </ModeButton>
        <ModeButton $active={mode === 'text'} onClick={() => setMode('text')}>
          テキスト編集
        </ModeButton>
        {mode === 'list' && (
          <Button variant="text" size="small" onClick={t.addStep}>
            + 行追加
          </Button>
        )}
      </ModeBar>

      {mode === 'list' ? (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th></th>
                <th className="name">名前</th>
                <th>配分</th>
                <th>絶対 (開始→終了)</th>
                <th>累積 (開始→終了)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {t.planRows.map((row) => {
                const i = row.index

                return (
                  <Row key={t.plan.steps[i].id} $current={t.curIndex === i}>
                    <td className="idx">{t.curIndex === i ? '▶' : i + 1}</td>
                    <td className="name">
                      <EditableText
                        value={row.name}
                        parse={(s) => s}
                        onCommit={(name) => t.renameStep(i, name)}
                        width={140}
                        align="left"
                        placeholder="(名称)"
                      />
                    </td>
                    <td>
                      <EditableText
                        value={formatDuration(row.durationMin)}
                        parse={parseDuration}
                        onCommit={(min) => t.editDuration(i, min)}
                        width={56}
                      />
                    </td>
                    <td className="pair">
                      <span className="ro">{formatClock(row.absStartMin)}</span>
                      <span className="arrow">→</span>
                      <EditableText
                        value={formatClock(row.absEndMin)}
                        parse={parseClock}
                        onCommit={(end) => t.editAbsoluteEnd(i, end)}
                        width={64}
                      />
                    </td>
                    <td className="pair">
                      <span className="ro">
                        {formatCumulative(row.cumStartMin)}
                      </span>
                      <span className="arrow">→</span>
                      <EditableText
                        value={formatCumulative(row.cumEndMin)}
                        parse={parseClock}
                        onCommit={(end) => t.editCumulativeEnd(i, end)}
                        width={64}
                      />
                    </td>
                    <td>
                      <DelButton onClick={() => t.removeStep(i)} title="削除">
                        ×
                      </DelButton>
                    </td>
                  </Row>
                )
              })}
            </tbody>
          </Table>
        </TableScroll>
      ) : (
        <PlanTextEditor t={t} />
      )}

      <Help>
        配分表記: <code>40</code>=40分, <code>1:30</code>=90分,{' '}
        <code>0:70</code>=70分
        (=1:10)。配分・絶対終了・累積終了のどれを編集しても同期します。テキスト編集は{' '}
        <code>@14:00</code> で開始、各行 <code>名前 配分</code>
        (配分は末尾)。開始後は実績バーの境界 <code>⇆</code>{' '}
        をドラッグして左右にずらせます (予定とは別、後続が平行移動)。
      </Help>
    </Wrap>
  )
}

/** テキスト編集: ローカル draft を入力源にして caret を安定させ、変更を予定へ反映。 */
const PlanTextEditor = ({ t }: { t: ProgressTimerApi }) => {
  const [text, setText] = useState(() => encodePlanText(t.plan))

  return (
    <TextArea
      value={text}
      spellCheck={false}
      onChange={(e) => {
        setText(e.target.value)
        t.setPlanFromText(e.target.value)
      }}
    />
  )
}

const Wrap = styled.div`
  font-variant-numeric: tabular-nums;
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .now,
  .total {
    font-size: 0.9rem;
    color: #555;
  }
`

const Field = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #555;

  input {
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`

const Now = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid #4080ff55;
  border-radius: 8px;
  background: #4080ff0d;

  .head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.95rem;
  }
`

const Track = styled.div`
  height: 8px;
  border-radius: 4px;
  background: #00000014;
  overflow: hidden;
`

const TrackFill = styled.div`
  height: 100%;
  background: #4080ff;
  transition: width 0.5s linear;
`

const ModeBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
`

const ModeButton = styled.button<{ $active: boolean }>`
  font: inherit;
  font-size: 0.85rem;
  padding: 4px 12px;
  border: 1px solid ${(p) => (p.$active ? '#4080ff' : '#ccc')};
  border-radius: 6px;
  background: ${(p) => (p.$active ? '#4080ff' : '#fff')};
  color: ${(p) => (p.$active ? '#fff' : '#555')};
  cursor: pointer;
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.95rem;
  line-height: 1.6;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
  box-sizing: border-box;
`

const TableScroll = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-size: 0.95rem;

  th,
  td {
    padding: 4px 8px;
    border-bottom: 1px solid #eee;
    text-align: center;
    white-space: nowrap;
  }
  th {
    font-size: 0.8rem;
    color: #888;
    font-weight: 600;
  }
  th.name,
  td.name {
    text-align: left;
  }
  td.idx {
    color: #4080ff;
    font-weight: 700;
  }
  td.pair {
    .ro {
      color: #666;
    }
    .arrow {
      margin: 0 2px;
      color: #bbb;
    }
  }
`

const Row = styled.tr<{ $current: boolean }>`
  background: ${(p) => (p.$current ? '#4080ff14' : 'transparent')};
`

const DelButton = styled.button`
  border: none;
  background: transparent;
  color: #bbb;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;

  &:hover {
    color: #e74c3c;
  }
`

const Help = styled.p`
  margin-top: 16px;
  font-size: 0.8rem;
  color: #888;
  line-height: 1.6;

  code {
    background: #00000010;
    padding: 1px 4px;
    border-radius: 3px;
  }
`

export default ProgressTimer
