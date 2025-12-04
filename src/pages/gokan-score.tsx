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

// 子音の調音情報 (7段階 IPA準拠)
// 1=両唇音, 2=唇歯音, 3=歯茎音, 4=後部歯茎音, 5=硬口蓋音, 6=軟口蓋音, 7=声門音
type ConsonantInfo = {
  pos: number
  voiced: boolean
  fricative: boolean
  label: string
}

const POS_LABELS: Record<number, string> = {
  1: '両唇',
  2: '唇歯',
  3: '歯茎',
  4: '後部歯茎',
  5: '硬口蓋',
  6: '軟口蓋',
  7: '声門',
}

const CONSONANTS: Record<string, ConsonantInfo> = {
  // 両唇音 (Bilabial) pos=1
  p: { pos: 1, voiced: false, fricative: false, label: '両唇音' },
  b: { pos: 1, voiced: true, fricative: false, label: '両唇音' },
  m: { pos: 1, voiced: true, fricative: false, label: '両唇音' },
  w: { pos: 1, voiced: true, fricative: false, label: '両唇音' },

  // 唇歯音 (Labiodental) pos=2
  f: { pos: 2, voiced: false, fricative: true, label: '唇歯音' },
  v: { pos: 2, voiced: true, fricative: true, label: '唇歯音' },

  // 歯茎音 (Alveolar) pos=3
  t: { pos: 3, voiced: false, fricative: false, label: '歯茎音' },
  d: { pos: 3, voiced: true, fricative: false, label: '歯茎音' },
  n: { pos: 3, voiced: true, fricative: false, label: '歯茎音' },
  s: { pos: 3, voiced: false, fricative: true, label: '歯茎音' },
  z: { pos: 3, voiced: true, fricative: true, label: '歯茎音' },
  r: { pos: 3, voiced: true, fricative: false, label: '歯茎音' },
  l: { pos: 3, voiced: true, fricative: false, label: '歯茎音' },

  // 後部歯茎音 (Postalveolar) pos=4
  c: { pos: 4, voiced: false, fricative: false, label: '後部歯茎音' }, // ch的な音
  j: { pos: 4, voiced: true, fricative: true, label: '後部歯茎音' },
  x: { pos: 4, voiced: false, fricative: true, label: '後部歯茎音' }, // sh的な音

  // 硬口蓋音 (Palatal) pos=5
  y: { pos: 5, voiced: true, fricative: false, label: '硬口蓋音' },

  // 軟口蓋音 (Velar) pos=6
  k: { pos: 6, voiced: false, fricative: false, label: '軟口蓋音' },
  g: { pos: 6, voiced: true, fricative: false, label: '軟口蓋音' },
  q: { pos: 6, voiced: false, fricative: false, label: '軟口蓋音' },

  // 声門音 (Glottal) pos=7
  h: { pos: 7, voiced: false, fricative: true, label: '声門音' },
}

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

// 母音の調音情報
type VowelInfo = {
  frontBack: number // 前後位置: 1=前舌, 2=中舌, 3=後舌
  height: number // 開口度: 1=狭, 2=中, 3=広
}

const VOWEL_INFO: Record<string, VowelInfo> = {
  i: { frontBack: 1, height: 1 }, // 前舌・狭
  e: { frontBack: 1, height: 2 }, // 前舌・中
  a: { frontBack: 2, height: 3 }, // 中舌・広
  o: { frontBack: 3, height: 2 }, // 後舌・中
  u: { frontBack: 3, height: 1 }, // 後舌・狭
}

// ローマ字を解析する
function parseRomaji(input: string): {
  consonants: string[]
  vowels: string[]
  vowelCount: number
  syllables: string[]
} {
  const name = input.toLowerCase().replace(/[^a-z]/g, '')
  const consonants: string[] = []
  const vowels: string[] = []
  const syllables: string[] = []
  let currentSyllable = ''
  let vowelCount = 0

  for (const ch of name) {
    if (VOWELS.has(ch)) {
      vowelCount++
      vowels.push(ch)
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

  return { consonants, vowels, vowelCount, syllables }
}

// スコア計算
function calculateScore(input: string): {
  total: number
  lengthScore: number
  posScore: number
  balanceScore: number
  cvScore: number
  vowelScore: number
  details: {
    moraCount: number
    consonantCount: number
    voicedCount: number
    unvoicedCount: number
    posTransitions: string[]
    vowelTransitions: string[]
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
      vowelScore: 0,
      details: {
        moraCount: 0,
        consonantCount: 0,
        voicedCount: 0,
        unvoicedCount: 0,
        posTransitions: [],
        vowelTransitions: [],
        tags: [],
      },
    }
  }

  const { consonants, vowels, vowelCount, syllables } = parseRomaji(name)
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
      posTransitions.push(
        `${POS_LABELS[prevPos] || prevPos}→${POS_LABELS[info.pos] || info.pos}`
      )
      // 7段階に合わせたペナルティ
      if (diff <= 1) posPenalty += 0 // 同じ or 1段: 滑らか
      else if (diff === 2) posPenalty += 0.5 // 2段: やや跳ぶ
      else if (diff === 3) posPenalty += 1 // 3段: 跳ぶ
      else posPenalty += 2 // 4段以上: 大きく跳ぶ
    }
    prevPos = info.pos
  }
  const maxPenalty = 10
  let posScore = Math.max(0, 30 - Math.min(posPenalty, maxPenalty) * 3)

  // 子音が1つ以下の場合は位置移動の評価ができない
  if (consonants.length <= 1) {
    posScore = 20 // 中間的な値
  }

  // (4) 有声/無声バランススコア (0-15)
  let balanceScore = 15
  const totalC = voicedCount + unvoicedCount
  if (totalC > 0) {
    const ratio = voicedCount / totalC
    const diff = Math.abs(ratio - 0.5)
    balanceScore = Math.max(0, Math.round(15 - diff * 30))
  }

  // (5) 母音の流れスコア (0-15)
  let vowelPenalty = 0
  let prevVowelPos: number | null = null
  const vowelTransitions: string[] = []

  for (const v of vowels) {
    const info = VOWEL_INFO[v]
    if (!info) continue

    if (prevVowelPos != null) {
      const diff = Math.abs(info.frontBack - prevVowelPos)
      vowelTransitions.push(`${prevVowelPos}→${info.frontBack}`)
      if (diff === 0)
        vowelPenalty += 0 // 同じ位置
      else if (diff === 1)
        vowelPenalty += 0 // 1段移動: 滑らか
      else vowelPenalty += 1.5 // 2段: 跳ぶ
    }
    prevVowelPos = info.frontBack
  }
  let vowelScore = Math.max(0, 15 - Math.min(vowelPenalty, 5) * 3)

  // 母音が1つ以下の場合
  if (vowels.length <= 1) {
    vowelScore = 10
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

  const total = Math.min(
    100,
    lengthScore + posScore + balanceScore + cvScore + vowelScore
  )

  return {
    total: Math.round(total),
    lengthScore: Math.round(lengthScore),
    posScore: Math.round(posScore),
    balanceScore: Math.round(balanceScore),
    cvScore: Math.round(cvScore),
    vowelScore: Math.round(vowelScore),
    details: {
      moraCount,
      consonantCount: consonants.length,
      voicedCount,
      unvoicedCount,
      posTransitions,
      vowelTransitions,
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
                        {result.balanceScore}/15
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
                    <TableRow>
                      <TableCell>母音の流れ</TableCell>
                      <TableCell align="right">
                        {result.vowelScore}/15
                      </TableCell>
                      <TableCell>
                        {result.details.vowelTransitions.length > 0
                          ? result.details.vowelTransitions.join(', ')
                          : '-'}
                      </TableCell>
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
            子音テーブル (7段階)
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}></TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      両唇
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      唇歯
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      歯茎
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      後部歯茎
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      硬口蓋
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      軟口蓋
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      声門
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>無声</TableCell>
                    <TableCell align="center">p</TableCell>
                    <TableCell align="center">f</TableCell>
                    <TableCell align="center">t, s</TableCell>
                    <TableCell align="center">c, x</TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="center">k, q</TableCell>
                    <TableCell align="center">h</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>有声</TableCell>
                    <TableCell align="center">b, m, w</TableCell>
                    <TableCell align="center">v</TableCell>
                    <TableCell align="center">d, n, z, r, l</TableCell>
                    <TableCell align="center">j</TableCell>
                    <TableCell align="center">y</TableCell>
                    <TableCell align="center">g</TableCell>
                    <TableCell align="center">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            ※ 隣接する位置への移動は滑らか（例: 両唇→唇歯→歯茎）
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            母音テーブル
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}></TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    前舌
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    中舌
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    後舌
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>狭 (閉)</TableCell>
                  <TableCell align="center">i</TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="center">u</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>中</TableCell>
                  <TableCell align="center">e</TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="center">o</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>広 (開)</TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="center">a</TableCell>
                  <TableCell align="center">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            ※ 前舌→中舌→後舌の流れが滑らか（例: i→a→u）
          </Typography>
        </Paper>
      </Stack>
    </Layout>
  )
}

export default GokanScore
