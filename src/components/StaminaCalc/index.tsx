import {
  Box,
  Paper,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import styled from 'styled-components'
import StaminaChart from './StaminaChart'

// 基本パラメータ
type Params = {
  naturalRecoveryPerHour: number // 自然回復/h
  naturalRecoveryCap: number // 自然回復上限
  relicGenerationPer10h: number // 世界樹聖物生成/10h
  relicCollectionAmount: number // 世界樹聖物回収量
  staminaCap: number // キャンディ上限
  shopCandy: number // ショップキャンディ
  stoneRefill: number // 石割りx3
  morningNightCandy: number // 朝夜キャン
  eventCost: number // イベント消費
  dailyQuestCost: number // デイリーノルマ
  morningConsume: number // 朝消費量
}

const DEFAULT_PARAMS: Params = {
  naturalRecoveryPerHour: 10,
  naturalRecoveryCap: 162,
  relicGenerationPer10h: 192,
  relicCollectionAmount: 346,
  staminaCap: 1000,
  shopCandy: 100,
  stoneRefill: 300,
  morningNightCandy: 100,
  eventCost: 200,
  dailyQuestCost: 100,
  morningConsume: 40,
}

// 時間帯イベント
type TimelineEvent = {
  time: string
  label: string
  stamina: number
  consumed: number // この行での消費量
  relic: number
  stock: number
  memo: string
}

function calcRelicAtHour(params: Params, hours: number): number {
  const perHour = params.relicGenerationPer10h / 10
  return Math.floor(perHour * hours)
}

// 前日18時〜翌0時の世界樹聖物蓄積 (6h分)
function calcRelicCarryOver(params: Params): number {
  return calcRelicAtHour(params, 6)
}

function calcTimeline(params: Params): TimelineEvent[] {
  const events: TimelineEvent[] = []
  let stamina = 0
  let stock = 0
  const relicCarryOver = calcRelicCarryOver(params)
  let relic = relicCarryOver
  let totalConsumed = 0

  const push = (time: string, label: string, consumed: number, memo: string) => {
    totalConsumed += consumed
    events.push({ time, label, stamina, consumed: totalConsumed, relic, stock, memo })
  }

  // 00:00 開始 (消費リセット、キャンディ0)
  push('00:00', '開始', 0, `世界樹聖物${relic}引継`)

  // 09:00 自然回復 (9h)
  const morning9hRecovery = Math.min(
    params.naturalRecoveryPerHour * 9,
    params.naturalRecoveryCap
  )
  stamina = morning9hRecovery
  relic = relicCarryOver + calcRelicAtHour(params, 9)
  push('09:00', '自然回復', 0, `+${morning9hRecovery} 回復`)

  // 09:00 育成消化 (溢れ防止)
  if (params.morningConsume > 0) {
    stamina -= params.morningConsume
    push('09:00', '育成消化', params.morningConsume, `-${params.morningConsume} 溢れ防止`)
  }

  // 18:00 自然回復 (9h)
  const afternoon9hRecovery = Math.min(
    params.naturalRecoveryPerHour * 9,
    params.naturalRecoveryCap - stamina
  )
  stamina += afternoon9hRecovery
  relic = relicCarryOver + calcRelicAtHour(params, 18)
  push('18:00', '自然回復', 0, `+${afternoon9hRecovery} 回復`)

  // 18:00 ショップ
  if (stamina + params.shopCandy > params.staminaCap) {
    stock += params.shopCandy
    push('18:00', 'ショップ', 0, `+${params.shopCandy} → 貯蓄飴`)
  } else {
    stamina += params.shopCandy
    push('18:00', 'ショップ', 0, `+${params.shopCandy}`)
  }

  // 18:00 石割りx3
  if (stamina + params.stoneRefill > params.staminaCap) {
    stock += params.stoneRefill
    push('18:00', '石割りx3', 0, `+${params.stoneRefill} → 貯蓄飴`)
  } else {
    stamina += params.stoneRefill
    push('18:00', '石割りx3', 0, `+${params.stoneRefill}`)
  }

  // 18:00 朝夜キャン
  if (stamina + params.morningNightCandy > params.staminaCap) {
    stock += params.morningNightCandy
    push('18:00', '朝夜キャン', 0, `+${params.morningNightCandy} → 貯蓄飴`)
  } else {
    stamina += params.morningNightCandy
    push('18:00', '朝夜キャン', 0, `+${params.morningNightCandy}`)
  }

  // 18:00 世界樹聖物回収
  if (stamina + relic > params.staminaCap) {
    stock += relic
    push('18:00', '世界樹聖物回収', 0, `+${relic} → 貯蓄飴`)
  } else {
    stamina += relic
    push('18:00', '世界樹聖物回収', 0, `+${relic} 回収`)
  }
  relic = 0

  // 18:00 消費 (内訳: イベント→デイリーノルマ→育成)
  if (stamina > 0) {
    const total18 = stamina
    const eventAmt = Math.min(total18, params.eventCost)
    const dailyAmt = Math.min(total18 - eventAmt, params.dailyQuestCost)
    const trainingAmt = total18 - eventAmt - dailyAmt

    stamina = 0
    if (eventAmt > 0) push('18:00', 'イベント消化', eventAmt, `-${eventAmt}`)
    if (dailyAmt > 0) push('18:00', 'デイリーノルマ', dailyAmt, `-${dailyAmt}`)
    if (trainingAmt > 0) push('18:00', '育成消化', trainingAmt, `-${trainingAmt}`)
  }

  // 23:00 自然回復 (5h, キャンディ=0から)
  const evening5hRecovery = Math.min(
    params.naturalRecoveryPerHour * 5,
    params.naturalRecoveryCap
  )
  stamina = evening5hRecovery
  relic = calcRelicAtHour(params, 5)
  push('23:00', '自然回復', 0, `+${evening5hRecovery} 回復`)

  // 23:00 消費 (内訳: 残りのイベント/デイリーノルマ→育成)
  if (stamina > 0) {
    const consumed23 = stamina
    const eventRemain = Math.max(0, params.eventCost - totalConsumed)
    const eventAmt23 = Math.min(consumed23, eventRemain)
    const dailyRemain = Math.max(0, params.dailyQuestCost - Math.max(0, totalConsumed - params.eventCost))
    const dailyAmt23 = Math.min(consumed23 - eventAmt23, dailyRemain)
    const trainingAmt23 = consumed23 - eventAmt23 - dailyAmt23

    stamina = 0
    if (eventAmt23 > 0) push('23:00', 'イベント消化', eventAmt23, `-${eventAmt23}`)
    if (dailyAmt23 > 0) push('23:00', 'デイリーノルマ', dailyAmt23, `-${dailyAmt23}`)
    if (trainingAmt23 > 0) push('23:00', '育成消化', trainingAmt23, `-${trainingAmt23}`)
  }

  return events
}

function calcOverflowCheck(params: Params): {
  staminaAt18: number
  isOverflow: boolean
} {
  const morningStamina =
    Math.min(params.naturalRecoveryPerHour * 9, params.naturalRecoveryCap) -
    params.morningConsume
  const staminaAt18 =
    morningStamina +
    Math.min(
      params.naturalRecoveryPerHour * 9,
      params.naturalRecoveryCap - morningStamina
    )
  return {
    staminaAt18,
    isOverflow: staminaAt18 > params.naturalRecoveryCap,
  }
}

function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}時間${m}分`
}

function calcRecoveryTime(params: Params): {
  naturalRecoveryTime: number
  relicToCapTime: number
} {
  const naturalRecoveryTime = params.naturalRecoveryCap / params.naturalRecoveryPerHour
  const relicPerHour = params.relicGenerationPer10h / 10
  const relicToCapTime = params.relicCollectionAmount / relicPerHour
  return { naturalRecoveryTime, relicToCapTime }
}

function calcCandyNeededAt18(params: Params, currentHour: number): number {
  if (currentHour >= 18) return params.naturalRecoveryCap
  const hoursUntil18 = 18 - currentHour
  const recoveryUntil18 = params.naturalRecoveryPerHour * hoursUntil18
  return Math.max(0, params.naturalRecoveryCap - recoveryUntil18)
}

const StaminaCalc = () => {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())

  const timeline = calcTimeline(params)
  const overflowCheck = calcOverflowCheck(params)
  const dailyStockGain = Math.max(
    0,
    timeline[timeline.length - 2]?.stock ?? 0
  )

  const updateParam = (key: keyof Params, value: number) => {
    setParams({ ...params, [key]: value })
  }

  return (
    <Style>
      <Box display="flex" flexDirection="column" gap={3}>
        {/* パラメータ設定 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            パラメータ設定
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            <ParamField
              label="自然回復 (/h)"
              value={params.naturalRecoveryPerHour}
              onChange={(v) => updateParam('naturalRecoveryPerHour', v)}
            />
            <ParamField
              label="自然回復上限"
              value={params.naturalRecoveryCap}
              onChange={(v) => updateParam('naturalRecoveryCap', v)}
            />
            <ParamField
              label="世界樹聖物生成 (/10h)"
              value={params.relicGenerationPer10h}
              onChange={(v) => updateParam('relicGenerationPer10h', v)}
            />
            <ParamField
              label="世界樹聖物回収量"
              value={params.relicCollectionAmount}
              onChange={(v) => updateParam('relicCollectionAmount', v)}
            />
            <ParamField
              label="キャンディ上限"
              value={params.staminaCap}
              onChange={(v) => updateParam('staminaCap', v)}
            />
            <ParamField
              label="ショップキャンディ"
              value={params.shopCandy}
              onChange={(v) => updateParam('shopCandy', v)}
            />
            <ParamField
              label="石割りx3"
              value={params.stoneRefill}
              onChange={(v) => updateParam('stoneRefill', v)}
            />
            <ParamField
              label="朝夜キャン"
              value={params.morningNightCandy}
              onChange={(v) => updateParam('morningNightCandy', v)}
            />
            <ParamField
              label="イベント消費"
              value={params.eventCost}
              onChange={(v) => updateParam('eventCost', v)}
            />
            <ParamField
              label="デイリーノルマ"
              value={params.dailyQuestCost}
              onChange={(v) => updateParam('dailyQuestCost', v)}
            />
          </Box>
          <Box mt={2}>
            <Typography variant="subtitle2">
              朝消費量: {params.morningConsume}
            </Typography>
            <Slider
              value={params.morningConsume}
              onChange={(_, v) => updateParam('morningConsume', v as number)}
              min={0}
              max={100}
              step={10}
              valueLabelDisplay="auto"
            />
          </Box>
        </Paper>

        {/* サマリー */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            サマリー
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap">
            <SummaryCard
              label="1日の貯蓄飴増加"
              value={`+${dailyStockGain}`}
              color={dailyStockGain > 0 ? '#4caf50' : '#f44336'}
            />
            <SummaryCard
              label="18時キャンディ"
              value={String(overflowCheck.staminaAt18)}
              color={overflowCheck.isOverflow ? '#f44336' : '#4caf50'}
              sub={
                overflowCheck.isOverflow
                  ? '溢れリスクあり'
                  : '溢れなし'
              }
            />
            <SummaryCard
              label="世界樹聖物回収量 (18h)"
              value={String(calcRelicAtHour(params, 18))}
              color="#2196f3"
            />
          </Box>
        </Paper>

        {/* 回復時間 & 18時逆算 */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            回復時間 & 18時逆算
          </Typography>
          <Box display="flex" gap={3} flexWrap="wrap" mb={2}>
            <SummaryCard
              label="自然回復 0→上限"
              value={formatHoursMinutes(calcRecoveryTime(params).naturalRecoveryTime)}
              color="#66bb6a"
              sub={`${params.naturalRecoveryCap} / ${params.naturalRecoveryPerHour}/h`}
            />
            <SummaryCard
              label="世界樹聖物 0→上限"
              value={formatHoursMinutes(calcRecoveryTime(params).relicToCapTime)}
              color="#388e3c"
              sub={`${params.relicCollectionAmount} / ${params.relicGenerationPer10h / 10}/h`}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField
              label="現在時刻 (時)"
              type="number"
              size="small"
              value={currentHour}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!isNaN(v) && v >= 0 && v <= 23) setCurrentHour(v)
              }}
              inputProps={{ min: 0, max: 23 }}
              sx={{ width: 120 }}
            />
            <SummaryCard
              label={`${currentHour}時→18時にMAXにするには`}
              value={
                currentHour >= 18
                  ? '既に18時以降'
                  : `${calcCandyNeededAt18(params, currentHour)}`
              }
              color={
                currentHour >= 18
                  ? '#888'
                  : calcCandyNeededAt18(params, currentHour) === 0
                    ? '#4caf50'
                    : '#ff9800'
              }
              sub={
                currentHour < 18
                  ? calcCandyNeededAt18(params, currentHour) === 0
                    ? '自然回復だけでMAX到達'
                    : `残り${18 - currentHour}hで回復${params.naturalRecoveryPerHour * (18 - currentHour)}`
                  : undefined
              }
            />
          </Box>
        </Paper>

        {/* 24時間棒グラフ */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            24時間キャンディ推移
          </Typography>
          <StaminaChart params={params} />
        </Paper>

        {/* タイムライン */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            1日のタイムライン
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>時刻</TableCell>
                  <TableCell>イベント</TableCell>
                  <TableCell align="right">キャンディ</TableCell>
                  <TableCell align="right">消費</TableCell>
                  <TableCell align="right">世界樹聖物</TableCell>
                  <TableCell align="right">貯蓄飴</TableCell>
                  <TableCell>メモ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeline.map((event, i) => (
                  <TableRow key={i}>
                    <TableCell>{event.time}</TableCell>
                    <TableCell>{event.label}</TableCell>
                    <TableCell align="right">
                      <StaminaValue
                        value={event.stamina}
                        cap={params.staminaCap}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {event.consumed > 0 && (
                        <span style={{ color: '#ef5350' }}>
                          {event.consumed}
                        </span>
                      )}
                      {event.consumed === 0 && '0'}
                    </TableCell>
                    <TableCell align="right">{event.relic}</TableCell>
                    <TableCell align="right">
                      {event.stock > 0 && (
                        <span style={{ color: '#e53935', fontWeight: 'bold' }}>
                          {event.stock}
                        </span>
                      )}
                      {event.stock === 0 && '0'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{event.memo}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 資源フロー */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            資源フロー
          </Typography>
          <Box
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              opacity: 0.8,
              lineHeight: 1.6,
            }}
          >
            {`自然回復 (${params.naturalRecoveryPerHour}/h)
   ↓
キャンディ (上限: ${params.staminaCap})
   ↓ 消費
イベント (-${params.eventCost}) + デイリーノルマ (-${params.dailyQuestCost})

世界樹聖物生成 (${params.relicGenerationPer10h}/10h)
   ↓ 回収
キャンディ
   ↓ ${params.staminaCap}超過
貯蓄飴`}
          </Box>
        </Paper>
      </Box>
    </Style>
  )
}

function ParamField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <TextField
      label={label}
      type="number"
      size="small"
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value)
        if (!isNaN(v)) onChange(v)
      }}
    />
  )
}

function StaminaValue({ value, cap }: { value: number; cap: number }) {
  const ratio = value / cap
  const color =
    ratio >= 1 ? '#f44336' : ratio >= 0.8 ? '#ff9800' : 'inherit'
  return <span style={{ color, fontWeight: ratio >= 0.8 ? 'bold' : 'normal' }}>{value}</span>
}

function SummaryCard({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, minWidth: 140, textAlign: 'center' }}
    >
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color, fontWeight: 'bold' }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  )
}

const Style = styled.div`
  width: 100%;
`

export default StaminaCalc
