import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { mix8 } from '../lib/mix8'
import { FaDice } from 'react-icons/fa'

/**
 * 0〜255のランダム整数を生成
 */
function randomByte(): number {
  return Math.floor(Math.random() * 256)
}

/**
 * 数値を8桁の2進数文字列に変換
 */
function toBinary8(n: number): string {
  return n.toString(2).padStart(8, '0')
}

/**
 * 8桁の2進数文字列を数値に変換（無効な場合はnullを返す）
 */
function binaryToNumber(binary: string): number | null {
  if (!/^[01]{8}$/.test(binary)) return null
  return parseInt(binary, 2)
}

/**
 * LocalStorageから値を取得（初回はランダム）
 */
function getInitialValue(key: string): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 255) {
        return parsed
      }
    }
  }
  return randomByte()
}

/**
 * LocalStorageに値を保存
 */
function saveValue(key: string, value: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value.toString())
  }
}

const title = 'Bit Mixer - 8bit合成ツール'

type ColorTheme = 'none' | 'red-black' | 'blue-yellow'

const BitMixer = () => {
  const [inputA, setInputA] = useState<number>(0)
  const [inputB, setInputB] = useState<number>(0)
  const [inputAText, setInputAText] = useState<string>('')
  const [inputBText, setInputBText] = useState<string>('')
  const [seeds, setSeeds] = useState<number[]>([])
  const [colorTheme, setColorTheme] = useState<ColorTheme>('none')
  const [resultCount, setResultCount] = useState<number>(10)

  // 初期化
  useEffect(() => {
    const a = getInitialValue('bit-mixer-a')
    const b = getInitialValue('bit-mixer-b')
    setInputA(a)
    setInputB(b)
    setInputAText(toBinary8(a))
    setInputBText(toBinary8(b))
    // 結果を10個生成
    const newSeeds = Array.from({ length: resultCount }, (_, i) =>
      getInitialValue(`bit-mixer-seed-${i}`)
    )
    setSeeds(newSeeds)
  }, [])

  // 値を保存
  useEffect(() => {
    saveValue('bit-mixer-a', inputA)
  }, [inputA])

  useEffect(() => {
    saveValue('bit-mixer-b', inputB)
  }, [inputB])

  useEffect(() => {
    seeds.forEach((seed, idx) => {
      saveValue(`bit-mixer-seed-${idx}`, seed)
    })
  }, [seeds])

  const handleBinaryInputChange =
    (
      textSetter: (v: string) => void,
      numSetter: (v: number) => void
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const binary = e.target.value
      textSetter(binary)
      // バリデーション：8桁の0/1のみの場合に数値を更新
      const num = binaryToNumber(binary)
      if (num !== null) {
        numSetter(num)
      }
    }

  const handleRandomizeInput =
    (numSetter: (v: number) => void, textSetter: (v: string) => void) =>
    () => {
      const rand = randomByte()
      numSetter(rand)
      textSetter(toBinary8(rand))
    }

  const handleSeedChange =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10)
      if (!isNaN(val) && val >= 0 && val <= 255) {
        const newSeeds = [...seeds]
        newSeeds[index] = val
        setSeeds(newSeeds)
      } else if (e.target.value === '') {
        const newSeeds = [...seeds]
        newSeeds[index] = 0
        setSeeds(newSeeds)
      }
    }

  const handleRandomizeSeed = (index: number) => () => {
    const newSeeds = [...seeds]
    newSeeds[index] = randomByte()
    setSeeds(newSeeds)
  }

  const handleAddResult = () => {
    const newSeeds = [...seeds, randomByte()]
    setSeeds(newSeeds)
    setResultCount(newSeeds.length)
  }

  const handleGenerateResults = (count: number) => {
    const newSeeds = Array.from({ length: count }, () => randomByte())
    setSeeds(newSeeds)
    setResultCount(count)
  }

  const results = seeds.map((seed) => mix8(inputA, inputB, seed))

  // バリデーション状態
  const isValidA = binaryToNumber(inputAText) !== null
  const isValidB = binaryToNumber(inputBText) !== null

  // カラーテーマに応じたスタイル（背景色）
  const getBitStyle = (bit: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-block',
      width: '1.2em',
      textAlign: 'center',
      fontFamily: 'monospace',
      fontWeight: 'normal',
    }

    if (colorTheme === 'none') return baseStyle

    if (colorTheme === 'red-black') {
      return {
        ...baseStyle,
        backgroundColor: bit === '1' ? '#ffcdd2' : '#e0e0e0',
        color: bit === '1' ? '#b71c1c' : '#212121',
      }
    }

    // blue-yellow
    return {
      ...baseStyle,
      backgroundColor: bit === '1' ? '#bbdefb' : '#fff9c4',
      color: bit === '1' ? '#0d47a1' : '#f57f17',
    }
  }

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          概要
        </Typography>
        <Typography variant="body2" paragraph>
          8bit整数を2つ入力し、各bitごとに擬似乱数的な合成を行うツールです。
          <br />
          同じ入力とシード値で常に同じ結果が得られます。
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Input A */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 80 }}>Input A:</Typography>
            <TextField
              value={inputAText}
              onChange={handleBinaryInputChange(setInputAText, setInputA)}
              placeholder="00000000"
              size="small"
              error={!isValidA}
              helperText={!isValidA ? '8桁の0/1を入力してください' : ''}
              sx={{
                width: 180,
                fontFamily: 'monospace',
                '& input': { fontFamily: 'monospace', letterSpacing: '0.1em' },
              }}
            />
            <IconButton
              onClick={handleRandomizeInput(setInputA, setInputAText)}
              size="small"
            >
              <FaDice />
            </IconButton>
            {isValidA && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                (= {inputA})
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* Input B */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 80 }}>Input B:</Typography>
            <TextField
              value={inputBText}
              onChange={handleBinaryInputChange(setInputBText, setInputB)}
              placeholder="00000000"
              size="small"
              error={!isValidB}
              helperText={!isValidB ? '8桁の0/1を入力してください' : ''}
              sx={{
                width: 180,
                fontFamily: 'monospace',
                '& input': { fontFamily: 'monospace', letterSpacing: '0.1em' },
              }}
            />
            <IconButton
              onClick={handleRandomizeInput(setInputB, setInputBText)}
              size="small"
            >
              <FaDice />
            </IconButton>
            {isValidB && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                (= {inputB})
              </Typography>
            )}
          </Stack>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Results */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">合成結果</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">色:</Typography>
            <Button
              size="small"
              variant={colorTheme === 'none' ? 'contained' : 'outlined'}
              onClick={() => setColorTheme('none')}
            >
              なし
            </Button>
            <Button
              size="small"
              variant={colorTheme === 'red-black' ? 'contained' : 'outlined'}
              onClick={() => setColorTheme('red-black')}
            >
              赤黒
            </Button>
            <Button
              size="small"
              variant={colorTheme === 'blue-yellow' ? 'contained' : 'outlined'}
              onClick={() => setColorTheme('blue-yellow')}
            >
              青黄
            </Button>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button size="small" variant="outlined" onClick={handleAddResult}>
            +1
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleGenerateResults(10)}
            sx={{ bgcolor: 'primary.main' }}
          >
            10個生成
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleGenerateResults(50)}
          >
            50個生成
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleGenerateResults(100)}
          >
            100個生成
          </Button>
        </Stack>
        <Stack spacing={0.5}>
          {results.map((result, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                px: 1,
                bgcolor: idx % 2 === 0 ? 'grey.100' : 'grey.50',
                borderRadius: 1,
              }}
            >
              <Box
                sx={{
                  fontSize: '1.1rem',
                  flex: 1,
                  display: 'flex',
                  gap: 0.25,
                }}
              >
                {toBinary8(result)
                  .split('')
                  .map((bit, i) => (
                    <span key={i} style={getBitStyle(bit)}>
                      {bit}
                    </span>
                  ))}
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TextField
                  type="number"
                  value={seeds[idx]}
                  onChange={handleSeedChange(idx)}
                  inputProps={{ min: 0, max: 255, step: 1 }}
                  size="small"
                  sx={{
                    width: 70,
                    '& input': { fontSize: '0.75rem', py: 0.5 },
                  }}
                />
                <IconButton
                  onClick={handleRandomizeSeed(idx)}
                  size="small"
                  sx={{ p: 0.5 }}
                >
                  <FaDice size={14} />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          仕様説明
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>アルゴリズム:</strong>
        </Typography>
        <Typography variant="body2" component="div" sx={{ pl: 2 }}>
          <ul>
            <li>各bitについて0〜7のインデックスで処理</li>
            <li>
              入力Aの該当bitと入力Bの該当bitが同じならその値を採用（保持）
            </li>
            <li>
              異なる場合、擬似乱数を生成してどちらを採用するか決定:
              <br />
              <code>
                seed = (a * 37 + b * 73 + i * 97 + seedExtra * 11) & 0xFF
              </code>
              <br />
              <code>pseudo = (seed ^ ((seed &gt;&gt; 3) * 11)) & 0xFF</code>
              <br />
              <code>chosen = (pseudo & 1) ? bit_a : bit_b</code>
            </li>
            <li>最終的に各bitを統合して8bit整数として返す</li>
          </ul>
        </Typography>
        <Typography variant="body2" paragraph sx={{ mt: 2 }}>
          <strong>想定用途:</strong>
        </Typography>
        <Typography variant="body2" component="div" sx={{ pl: 2 }}>
          <ul>
            <li>ビットパターン同士の「ゆらぎを持つブレンド」生成</li>
            <li>アニメーションフレーム間補間の擬似ノイズ</li>
            <li>パターン安定性＋揺らぎ表現の両立</li>
          </ul>
        </Typography>
      </Box>
    </Layout>
  )
}

export default BitMixer
