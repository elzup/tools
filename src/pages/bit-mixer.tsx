import {
  Box,
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

const BitMixer = () => {
  const [inputA, setInputA] = useState<number>(0)
  const [inputB, setInputB] = useState<number>(0)
  const [seeds, setSeeds] = useState<number[]>([])

  // 初期化
  useEffect(() => {
    setInputA(getInitialValue('bit-mixer-a'))
    setInputB(getInitialValue('bit-mixer-b'))
    const s1 = getInitialValue('bit-mixer-seed-0')
    const s2 = getInitialValue('bit-mixer-seed-1')
    const s3 = getInitialValue('bit-mixer-seed-2')
    setSeeds([s1, s2, s3])
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

  const handleInputChange =
    (setter: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10)
      if (!isNaN(val) && val >= 0 && val <= 255) {
        setter(val)
      } else if (e.target.value === '') {
        setter(0)
      }
    }

  const handleRandomizeInput = (setter: (v: number) => void) => () => {
    setter(randomByte())
  }

  const handleRandomizeSeed = (index: number) => () => {
    const newSeeds = [...seeds]
    newSeeds[index] = randomByte()
    setSeeds(newSeeds)
  }

  const results = seeds.map((seed) => mix8(inputA, inputB, seed))

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
              type="number"
              value={inputA}
              onChange={handleInputChange(setInputA)}
              inputProps={{ min: 0, max: 255, step: 1 }}
              size="small"
              sx={{ width: 100 }}
            />
            <IconButton onClick={handleRandomizeInput(setInputA)} size="small">
              <FaDice />
            </IconButton>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', ml: 2 }}>
              {toBinary8(inputA)}
            </Typography>
          </Stack>
        </Paper>

        {/* Input B */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 80 }}>Input B:</Typography>
            <TextField
              type="number"
              value={inputB}
              onChange={handleInputChange(setInputB)}
              inputProps={{ min: 0, max: 255, step: 1 }}
              size="small"
              sx={{ width: 100 }}
            />
            <IconButton onClick={handleRandomizeInput(setInputB)} size="small">
              <FaDice />
            </IconButton>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', ml: 2 }}>
              {toBinary8(inputB)}
            </Typography>
          </Stack>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Results */}
        <Typography variant="h6">合成結果</Typography>
        {results.map((result, idx) => (
          <Paper key={idx} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: 80 }}>Seed {idx + 1}:</Typography>
              <TextField
                type="number"
                value={seeds[idx]}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val >= 0 && val <= 255) {
                    const newSeeds = [...seeds]
                    newSeeds[idx] = val
                    setSeeds(newSeeds)
                  } else if (e.target.value === '') {
                    const newSeeds = [...seeds]
                    newSeeds[idx] = 0
                    setSeeds(newSeeds)
                  }
                }}
                inputProps={{ min: 0, max: 255, step: 1 }}
                size="small"
                sx={{ width: 100 }}
              />
              <IconButton onClick={handleRandomizeSeed(idx)} size="small">
                <FaDice />
              </IconButton>
              <Typography sx={{ minWidth: 80 }}>→ Result:</Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'bold', minWidth: 50 }}
              >
                {result}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', ml: 2 }}
              >
                {toBinary8(result)}
              </Typography>
            </Stack>
          </Paper>
        ))}
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
