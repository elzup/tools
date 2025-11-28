import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import React, { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = '語感スコア'

// 子音の調音情報
type ConsonantInfo = {
  pos: number // 調音位置: 1=唇音(前), 2=歯茎音(中央), 3=軟口蓋音(後ろ), 4=声門音
  voiced: boolean // 有声か
  fricative: boolean // 摩擦音か
  label: string // 調音位置ラベル
}

const CONSONANTS: Record<string, ConsonantInfo> = {
  // 唇音（前・Labial）
  p: { pos: 1, voiced: false, fricative: false, label: '唇音' },
  b: { pos: 1, voiced: true, fricative: false, label: '唇音' },
  m: { pos: 1, voiced: true, fricative: false, label: '唇音' },
  f: { pos: 1, voiced: false, fricative: true, label: '唇音' },
  v: { pos: 1, voiced: true, fricative: true, label: '唇音' },
  w: { pos: 1, voiced: true, fricative: false, label: '唇音' },

  // 歯茎音（中央・Alveolar）
  t: { pos: 2, voiced: false, fricative: false, label: '歯茎音' },
  d: { pos: 2, voiced: true, fricative: false, label: '歯茎音' },
  n: { pos: 2, voiced: true, fricative: false, label: '歯茎音' },
  s: { pos: 2, voiced: false, fricative: true, label: '歯茎音' },
  z: { pos: 2, voiced: true, fricative: true, label: '歯茎音' },
  r: { pos: 2, voiced: true, fricative: false, label: '歯茎音' },
  l: { pos: 2, voiced: true, fricative: false, label: '歯茎音' },
  c: { pos: 2, voiced: false, fricative: false, label: '歯茎音' }, // /k/ or /s/
  j: { pos: 2, voiced: true, fricative: true, label: '歯茎音' },
  x: { pos: 2, voiced: false, fricative: true, label: '歯茎音' }, // /ks/

  // 軟口蓋音（後ろ・Velar）
  k: { pos: 3, voiced: false, fricative: false, label: '軟口蓋音' },
  g: { pos: 3, voiced: true, fricative: false, label: '軟口蓋音' },
  q: { pos: 3, voiced: false, fricative: false, label: '軟口蓋音' },

  // 声門音（さらに後ろ・Glottal）
  h: { pos: 4, voiced: false, fricative: true, label: '声門音' },

  // 半母音として扱う
  y: { pos: 2, voiced: true, fricative: false, label: '硬口蓋音' },
}

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

// ローマ字を解析する
function parseRomaji(input: string): {
  consonants: string[]
  vowelCount: number
  syllables: string[]
} {
  const name = input.toLowerCase().replace(/[^a-z]/g, '')
  const consonants: string[] = []
  const syllables: string[] = []
  let currentSyllable = ''
  let vowelCount = 0

  for (const ch of name) {
    if (VOWELS.has(ch)) {
      vowelCount++
      currentSyllable += ch
      syllables.push(currentSyllable)
      currentSyllable = ''
    } else {
      if (CONSONANTS[ch]) {
        consonants.push(ch)
      }
      currentSyllable += ch
    }
  }
  // 子音で終わる場合
  if (currentSyllable) {
    syllables.push(currentSyllable)
  }

  return { consonants, vowelCount, syllables }
}

// スコア計算
function calculateScore(input: string): {
  total: number
  lengthScore: number
  posScore: number
  balanceScore: number
  cvScore: number
  details: {
    moraCount: number
    consonantCount: number
    voicedCount: number
    unvoicedCount: number
    posTransitions: string[]
    tags: string[]
  }
} {
  const name = input.toLowerCase().replace(/[^a-z]/g, '')
  if (!name) {
    return {
      total: 0,
      lengthScore: 0,
      posScore: 0,
      balanceScore: 0,
      cvScore: 0,
      details: {
        moraCount: 0,
        consonantCount: 0,
        voicedCount: 0,
        unvoicedCount: 0,
        posTransitions: [],
        tags: [],
      },
    }
  }

  const { consonants, vowelCount, syllables } = parseRomaji(name)
  const moraCount = vowelCount || 1

  // (1) 長さスコア (0-30)
  let lengthScore = 0
  if (moraCount === 2 || moraCount === 3) lengthScore = 30
  else if (moraCount === 4) lengthScore = 25
  else if (moraCount === 1 || moraCount === 5) lengthScore = 18
  else if (moraCount === 6) lengthScore = 12
  else lengthScore = 8

  // (2) CV構造スコア (0-20)
  // 子音＋母音の繰り返しが理想
  let cvScore = 0
  const cvPattern = syllables.filter(
    (s) => s.length === 2 && !VOWELS.has(s[0]) && VOWELS.has(s[1])
  ).length
  const vOnlyPattern = syllables.filter(
    (s) => s.length === 1 && VOWELS.has(s[0])
  ).length
  const totalSyllables = syllables.length || 1
  const cvRatio = (cvPattern + vOnlyPattern * 0.5) / totalSyllables
  cvScore = Math.round(cvRatio * 20)

  // (3) 調音位置スコア (0-30)
  let posPenalty = 0
  let prevPos: number | null = null
  let voicedCount = 0
  let unvoicedCount = 0
  const posTransitions: string[] = []

  for (const c of consonants) {
    const info = CONSONANTS[c]
    if (!info) continue
    if (info.voiced) voicedCount++
    else unvoicedCount++

    if (prevPos != null) {
      const diff = Math.abs(info.pos - prevPos)
      posTransitions.push(`${prevPos}→${info.pos}`)
      if (diff === 0)
        posPenalty += 0 // 同じ位置: OK
      else if (diff === 1)
        posPenalty += 0 // 1段移動: 滑らか
      else if (diff === 2)
        posPenalty += 1.5 // 2段: ちょい跳ぶ
      else posPenalty += 3 // 3段以上: 大きく跳ぶ
    }
    prevPos = info.pos
  }
  const maxPenalty = 10
  let posScore = Math.max(0, 30 - Math.min(posPenalty, maxPenalty) * 3)

  // 子音が1つ以下の場合は位置移動の評価ができない
  if (consonants.length <= 1) {
    posScore = 20 // 中間的な値
  }

  // (4) 有声/無声バランススコア (0-20)
  let balanceScore = 20
  const totalC = voicedCount + unvoicedCount
  if (totalC > 0) {
    const ratio = voicedCount / totalC
    const diff = Math.abs(ratio - 0.5)
    balanceScore = Math.max(0, Math.round(20 - diff * 40))
  }

  // タグ生成
  const tags: string[] = []

  // 有声音が多い → 柔らかい
  if (totalC > 0 && voicedCount / totalC > 0.6) {
    tags.push('柔らかめ')
  }
  // 無声音が多い → シャープ
  if (totalC > 0 && unvoicedCount / totalC > 0.6) {
    tags.push('シャープ')
  }
  // 摩擦音が多い
  const fricativeCount = consonants.filter(
    (c) => CONSONANTS[c]?.fricative
  ).length
  if (totalC > 0 && fricativeCount / totalC > 0.4) {
    tags.push('スマート')
  }
  // 軟口蓋音(k,g)が多い
  const velarCount = consonants.filter((c) => CONSONANTS[c]?.pos === 3).length
  if (velarCount >= 2 || (totalC > 0 && velarCount / totalC > 0.4)) {
    tags.push('力強い')
  }
  // 唇音(m,b,p)が多い
  const labialCount = consonants.filter((c) => CONSONANTS[c]?.pos === 1).length
  if (labialCount >= 2 || (totalC > 0 && labialCount / totalC > 0.4)) {
    tags.push('優しい')
  }
  // 短い名前
  if (moraCount <= 2) {
    tags.push('コンパクト')
  }
  // 長い名前
  if (moraCount >= 5) {
    tags.push('重厚')
  }

  const total = Math.min(100, lengthScore + posScore + balanceScore + cvScore)

  return {
    total: Math.round(total),
    lengthScore: Math.round(lengthScore),
    posScore: Math.round(posScore),
    balanceScore: Math.round(balanceScore),
    cvScore: Math.round(cvScore),
    details: {
      moraCount,
      consonantCount: consonants.length,
      voicedCount,
      unvoicedCount,
      posTransitions,
      tags,
    },
  }
}

// スコアに応じた色
function getScoreColor(score: number): string {
  if (score >= 80) return '#4caf50'
  if (score >= 60) return '#8bc34a'
  if (score >= 40) return '#ffc107'
  if (score >= 20) return '#ff9800'
  return '#f44336'
}

// サンプル単語
const SAMPLES = [
  'mika',
  'sakura',
  'kataku',
  'nana',
  'kohaku',
  'stko',
  'minami',
  'riku',
  'hikari',
  'akira',
  'nova',
  'zephyr',
]

const GokanScore = () => {
  const [input, setInput] = useState('')

  const result = useMemo(() => calculateScore(input), [input])

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          ローマ字を入力すると、発音の調音位置・有声/無声・音節構造から語感を分析してスコアを表示します。
        </Typography>
      </Box>

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <TextField
            fullWidth
            label="ローマ字を入力"
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: mika, sakura, nova"
            sx={{ mb: 3 }}
          />

          {input && (
            <Stack spacing={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {result.total}
                  <Typography component="span" variant="h5" sx={{ ml: 1 }}>
                    / 100
                  </Typography>
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={result.total}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(result.total),
                      borderRadius: 6,
                    },
                  }}
                />
              </Box>

              {result.details.tags.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  flexWrap="wrap"
                >
                  {result.details.tags.map((tag, i) => (
                    <Chip
                      key={i}
                      label={tag}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>項目</TableCell>
                      <TableCell align="right">スコア</TableCell>
                      <TableCell>詳細</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>長さ</TableCell>
                      <TableCell align="right">
                        {result.lengthScore}/30
                      </TableCell>
                      <TableCell>{result.details.moraCount}モーラ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>調音位置</TableCell>
                      <TableCell align="right">{result.posScore}/30</TableCell>
                      <TableCell>
                        {result.details.posTransitions.length > 0
                          ? result.details.posTransitions.join(', ')
                          : '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>有声/無声バランス</TableCell>
                      <TableCell align="right">
                        {result.balanceScore}/20
                      </TableCell>
                      <TableCell>
                        有声:{result.details.voicedCount} / 無声:
                        {result.details.unvoicedCount}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CV構造</TableCell>
                      <TableCell align="right">{result.cvScore}/20</TableCell>
                      <TableCell>子音+母音の規則性</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            サンプル
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {SAMPLES.map((sample) => {
              const score = calculateScore(sample)
              return (
                <Chip
                  key={sample}
                  label={`${sample} (${score.total})`}
                  onClick={() => setInput(sample)}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${getScoreColor(score.total)}`,
                    mb: 1,
                  }}
                />
              )
            })}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            調音位置テーブル
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>位置</TableCell>
                  <TableCell>子音</TableCell>
                  <TableCell>特徴</TableCell>
                  <TableCell>印象</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1. 唇音（前）</TableCell>
                  <TableCell>p, b, m, f, v, w</TableCell>
                  <TableCell>口先で閉じる/開く</TableCell>
                  <TableCell>可愛い・優しい</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2. 歯茎音（中央）</TableCell>
                  <TableCell>t, d, n, s, z, r, l</TableCell>
                  <TableCell>舌先のタッチ</TableCell>
                  <TableCell>中性・リズム良い</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3. 軟口蓋音（後ろ）</TableCell>
                  <TableCell>k, g</TableCell>
                  <TableCell>喉奥の響き</TableCell>
                  <TableCell>強さ・硬質</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4. 声門音</TableCell>
                  <TableCell>h</TableCell>
                  <TableCell>息が抜ける</TableCell>
                  <TableCell>軽さ・風っぽい</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            ※
            調音位置が1段ずつ動く（前→中央→後ろ）並びは滑らかで語感が良いとされます
          </Typography>
        </Paper>
      </Stack>
    </Layout>
  )
}

export default GokanScore
