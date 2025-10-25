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
import React, { useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { mix8 } from '../lib/mix8'
import { FaDice } from 'react-icons/fa'
import { useLocalStorage } from '../utils/useLocalStorage'
import { range } from 'lodash'

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

const title = 'Bit Mixer - 8bit合成ツール'

type ColorTheme = 'none' | 'red-black' | 'blue-yellow'

/**
 * LocalStorage連携付きバイナリ入力のカスタムフック
 */
function useBinaryInput(storageKey: string) {
  const [value, setValue] = useLocalStorage<number>(storageKey, randomByte())
  const [text, setText] = useState<string>(() => toBinary8(value))

  const handleChange = (newText: string) => {
    setText(newText)
    const num = binaryToNumber(newText)
    if (num !== null) {
      setValue(num)
    }
  }

  const randomize = () => {
    const rand = randomByte()
    setValue(rand)
    setText(toBinary8(rand))
  }

  const isValid = binaryToNumber(text) !== null

  return { value, text, handleChange, randomize, isValid }
}

/**
 * 結果リストコンポーネント
 */
type MixResultListProps = {
  inputA: number
  inputB: number
  colorTheme: ColorTheme
  initialCount?: number
}

function MixResultList({
  inputA,
  inputB,
  colorTheme,
  initialCount = 10,
}: MixResultListProps) {
  const [seeds, setSeeds] = useState<number[]>(() =>
    range(initialCount).map(() => randomByte())
  )

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
    setSeeds([...seeds, randomByte()])
  }

  const handleGenerateResults = (count: number) => {
    setSeeds(range(count).map(() => randomByte()))
  }

  const results = seeds.map((seed) => mix8(inputA, inputB, seed))

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
    <>
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
    </>
  )
}

const BitMixer = () => {
  const inputA = useBinaryInput('bit-mixer-a')
  const inputB = useBinaryInput('bit-mixer-b')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('none')

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
        {/* Input A & B */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            {/* Input A */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography sx={{ minWidth: 60 }}>Input A:</Typography>
                <TextField
                  value={inputA.text}
                  onChange={(e) => inputA.handleChange(e.target.value)}
                  placeholder="00000000"
                  size="small"
                  error={!inputA.isValid}
                  FormHelperTextProps={{
                    sx: { minHeight: '20px', margin: 0 },
                  }}
                  helperText={!inputA.isValid ? '8桁の0/1を入力' : ' '}
                  sx={{
                    width: 180,
                    fontFamily: 'monospace',
                    '& input': {
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                    },
                  }}
                />
                <IconButton onClick={inputA.randomize} size="small">
                  <FaDice />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    minWidth: 50,
                    visibility: inputA.isValid ? 'visible' : 'hidden',
                  }}
                >
                  (= {inputA.value})
                </Typography>
              </Stack>
            </Box>

            {/* Input B */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography sx={{ minWidth: 60 }}>Input B:</Typography>
                <TextField
                  value={inputB.text}
                  onChange={(e) => inputB.handleChange(e.target.value)}
                  placeholder="00000000"
                  size="small"
                  error={!inputB.isValid}
                  FormHelperTextProps={{
                    sx: { minHeight: '20px', margin: 0 },
                  }}
                  helperText={!inputB.isValid ? '8桁の0/1を入力' : ' '}
                  sx={{
                    width: 180,
                    fontFamily: 'monospace',
                    '& input': {
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                    },
                  }}
                />
                <IconButton onClick={inputB.randomize} size="small">
                  <FaDice />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    minWidth: 50,
                    visibility: inputB.isValid ? 'visible' : 'hidden',
                  }}
                >
                  (= {inputB.value})
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Results */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
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
        <MixResultList
          key={`${inputA.value}-${inputB.value}`}
          inputA={inputA.value}
          inputB={inputB.value}
          colorTheme={colorTheme}
        />
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
