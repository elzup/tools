import { Button, Slider, Typography, useTheme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { LineChart, type Marker } from './LineChart'
import { TrialView } from './TrialView'
import {
  type DistParams,
  type KStat,
  argmax,
  mulberry32,
  pickWithSkip,
  sampleCandidates,
  simulate,
  theoryPBest,
} from './sim'

const UNIFORM: DistParams = { kind: 'uniform', mean: 50, sd: 0 }
const NORMAL_MEAN = 50
const DEFAULT_N = 100
const DEFAULT_SD = 15
const DEFAULT_TRIALS = 2000
// 1 人ずつ出すアニメーションの間隔。100 人で 3 秒程度に収まる長さ
const REVEAL_MS = 30
const INV_E = 1 / Math.E

const pct = (v: number) => `${(v * 100).toFixed(1)}%`

const SecretaryProblem = () => {
  const { palette } = useTheme()
  const [n, setN] = useState(DEFAULT_N)
  const [sd, setSd] = useState(DEFAULT_SD)
  const [trials, setTrials] = useState(DEFAULT_TRIALS)
  const [k, setK] = useState(Math.round(DEFAULT_N * INV_E))
  const [seed, setSeed] = useState(1)
  const [trialSeed, setTrialSeed] = useState(1)
  const [revealed, setRevealed] = useState(DEFAULT_N)

  const uniStats = useMemo(
    () => simulate(n, UNIFORM, trials, seed),
    [n, trials, seed]
  )
  const normStats = useMemo(
    () => simulate(n, { kind: 'normal', mean: NORMAL_MEAN, sd }, trials, seed),
    [n, sd, trials, seed]
  )
  const theory = useMemo(
    () => Array.from({ length: n }, (_, i) => theoryPBest(n, i)),
    [n]
  )

  const trial = useMemo(() => {
    const rand = mulberry32(trialSeed * 7919)
    return {
      uniform: sampleCandidates(n, UNIFORM, rand),
      normal: sampleCandidates(
        n,
        { kind: 'normal', mean: NORMAL_MEAN, sd },
        rand
      ),
    }
  }, [n, sd, trialSeed])

  const lastPick = Math.max(
    pickWithSkip(trial.uniform, k).index,
    pickWithSkip(trial.normal, k).index
  )

  useEffect(() => {
    if (revealed > lastPick) return
    const id = setTimeout(() => setRevealed((r) => r + 1), REVEAL_MS)
    return () => clearTimeout(id)
  }, [revealed, lastPick])

  const changeN = (next: number) => {
    setN(next)
    setK(Math.min(next - 1, Math.round(next * INV_E)))
    setRevealed(next)
  }

  const colors = {
    uniform: palette.primary.main,
    normal: palette.secondary.main,
  }
  const kOfBest = (stats: KStat[], key: 'pBest' | 'meanScore') =>
    argmax(stats.map((s) => s[key]))
  const best = {
    uniP: kOfBest(uniStats, 'pBest'),
    normP: kOfBest(normStats, 'pBest'),
    uniS: kOfBest(uniStats, 'meanScore'),
    normS: kOfBest(normStats, 'meanScore'),
  }
  const kMarkers = [
    { label: '1/e', x: INV_E, color: palette.warning.main },
    { label: `k=${k}`, x: k / n, color: palette.text.primary },
  ]

  return (
    <Wrap>
      <Typography variant="body2">
        n 人の候補者を 1 人ずつ面接し、その場で採用か不採用かを決める
        (戻れない)。 最初の k
        人は見送り、それ以降で「見送った中の最高」を超えた最初の人を採用する戦略を、
        実力が <b>一様分布 0〜100</b> の場合と{' '}
        <b>
          正規分布 (平均 {NORMAL_MEAN}, 標準偏差 {sd})
        </b>{' '}
        の場合で {trials.toLocaleString()} 回ずつ試す。
      </Typography>

      <Controls>
        <label>
          候補者数 n = {n}
          <Slider
            min={5}
            max={200}
            value={n}
            onChange={(_, v) => changeN(v as number)}
          />
        </label>
        <label>
          見送る人数 k = {k} ({pct(k / n)})
          <Slider
            min={0}
            max={n - 1}
            value={k}
            onChange={(_, v) => {
              setK(v as number)
              setRevealed(n)
            }}
          />
        </label>
        <label>
          正規分布の標準偏差 = {sd}
          <Slider
            min={1}
            max={40}
            value={sd}
            onChange={(_, v) => setSd(v as number)}
          />
        </label>
        <label>
          試行回数 = {trials.toLocaleString()}
          <Slider
            min={200}
            max={10000}
            step={200}
            value={trials}
            onChange={(_, v) => setTrials(v as number)}
          />
        </label>
      </Controls>

      <Section>
        <h3>1 回分の試行</h3>
        <Typography variant="caption" component="p">
          灰色の帯 = 見送り区間、点線 = 見送り中の最高、色付きの棒 =
          採用した人、★ = 実際の最良
        </Typography>
        <Row>
          <TrialView
            title="一様分布 0〜100"
            scores={trial.uniform}
            k={k}
            revealed={revealed}
            color={colors.uniform}
          />
          <TrialView
            title={`正規分布 N(${NORMAL_MEAN}, ${sd}²)`}
            scores={trial.normal}
            k={k}
            revealed={revealed}
            color={colors.normal}
          />
        </Row>
        <Buttons>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setTrialSeed((s) => s + 1)
              setRevealed(0)
            }}
          >
            新しい候補者で 1 人ずつ面接
          </Button>
          <Button size="small" onClick={() => setRevealed(0)}>
            同じ候補者でやり直す
          </Button>
        </Buttons>
      </Section>

      <Section>
        <h3>最良の 1 人を選べる確率</h3>
        <LineChart
          ariaLabel="見送る割合ごとの最良を選べる確率"
          series={[
            {
              label: '一様分布',
              color: colors.uniform,
              values: uniStats.map((s) => s.pBest),
            },
            {
              label: '正規分布',
              color: colors.normal,
              values: normStats.map((s) => s.pBest),
            },
            {
              label: '理論値',
              color: palette.text.secondary,
              values: theory,
              dashed: true,
            },
          ]}
          yMin={0}
          yMax={0.5}
          yTicks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]}
          formatY={(v) => `${Math.round(v * 100)}%`}
          markers={kMarkers}
          onSelectX={setK}
        />
        <Typography variant="body2">
          2
          本の曲線はほぼ重なる。この戦略は「誰が誰より上か」の順序しか見ないので、
          実力の分布が何であっても結果は同じになり、k ≈ n/e (約 37%) で最大の約
          37% になる。
        </Typography>
      </Section>

      <Section>
        <h3>採用した人の実力の平均</h3>
        <h4>一様分布 0〜100</h4>
        <ScoreChart
          label="一様分布 0〜100"
          color={colors.uniform}
          values={uniStats.map((s) => s.meanScore)}
          markers={[
            ...kMarkers,
            {
              label: `平均最大 k=${best.uniS}`,
              x: best.uniS / n,
              color: colors.uniform,
            },
          ]}
          onSelectX={setK}
        />
        <h4>正規分布</h4>
        <ScoreChart
          label="正規分布"
          color={colors.normal}
          values={normStats.map((s) => s.meanScore)}
          markers={[
            ...kMarkers,
            {
              label: `平均最大 k=${best.normS}`,
              x: best.normS / n,
              color: colors.normal,
            },
          ]}
          onSelectX={setK}
        />
        <Typography variant="body2">
          実力の尺度が分布ごとに違うので、縦軸はそれぞれのデータに合わせている。「最良かどうか」ではなく実力そのもので見ると分布の形が効いてくる。
          どちらも 37%
          より早く決めたほうが平均は高く、上位がなだらかに続く一様分布ほど早めが得になる。
        </Typography>
      </Section>

      <Section>
        <h3>まとめ (k = {k} と、それぞれの最適な k)</h3>
        <Table>
          <thead>
            <tr>
              <th />
              <th>最良を選ぶ確率 (k = {k})</th>
              <th>確率が最大になる k</th>
              <th>平均実力 (k = {k})</th>
              <th>平均が最大になる k</th>
              <th>最後の人で妥協 (k = {k})</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['一様分布', uniStats, best.uniP, best.uniS],
                ['正規分布', normStats, best.normP, best.normS],
              ] as const
            ).map(([label, stats, kp, ks]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{pct(stats[k].pBest)}</td>
                <td>
                  {kp} ({pct(kp / n)}) → {pct(stats[kp].pBest)}
                </td>
                <td>{stats[k].meanScore.toFixed(1)}</td>
                <td>
                  {ks} ({pct(ks / n)}) → {stats[ks].meanScore.toFixed(1)}
                </td>
                <td>{pct(stats[k].pFallback)}</td>
              </tr>
            ))}
            <tr>
              <th>理論値</th>
              <td>{pct(theory[k])}</td>
              <td colSpan={4}>
                {argmax(theory)} ({pct(argmax(theory) / n)}) →{' '}
                {pct(theory[argmax(theory)])}
              </td>
            </tr>
          </tbody>
        </Table>
        <Button size="small" onClick={() => setSeed((s) => s + 1)}>
          乱数を変えて再計算
        </Button>
      </Section>
    </Wrap>
  )
}

/** 縦軸の範囲と目盛り。分布ごとに実力の幅が大きく違うので、刻みを範囲から決める */
const scoreAxis = (values: number[]) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const step = span > 30 ? 10 : span > 10 ? 5 : span > 4 ? 2 : 1
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = Array.from(
    { length: Math.round((hi - lo) / step) + 1 },
    (_, i) => lo + i * step
  )
  return { lo, hi, ticks }
}

type ScoreChartProps = {
  label: string
  color: string
  values: number[]
  markers: Marker[]
  onSelectX: (k: number) => void
}

const ScoreChart = (p: ScoreChartProps) => {
  const axis = scoreAxis(p.values)
  return (
    <LineChart
      ariaLabel={`${p.label}: 見送る割合ごとの採用者の平均実力`}
      series={[{ label: p.label, color: p.color, values: p.values }]}
      yMin={axis.lo}
      yMax={axis.hi}
      yTicks={axis.ticks}
      formatY={(v) => v.toFixed(0)}
      markers={p.markers}
      onSelectX={p.onSelectX}
    />
  )
}

export default SecretaryProblem

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
`

const Controls = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0 24px;
  font-size: 14px;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  h3 {
    margin: 0;
    font-size: 16px;
  }
  h4 {
    margin: 8px 0 0;
    font-size: 14px;
  }
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Table = styled.table`
  border-collapse: collapse;
  font-size: 13px;
  display: block;
  overflow-x: auto;
  th,
  td {
    border: 1px solid rgba(128, 128, 128, 0.3);
    padding: 4px 8px;
    text-align: right;
    white-space: nowrap;
  }
  thead th,
  tbody th {
    text-align: left;
  }
`
