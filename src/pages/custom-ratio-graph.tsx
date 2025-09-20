import React, { useState } from 'react'
import { Container, TextField, Box, Typography, Paper } from '@mui/material'
import Layout from '../components/Layout'

type PieData = {
  label: string
  value: number
}

type ParsedData = {
  type: 'pie'
  data: PieData[]
}

const defaultDSL = `pie:
  "りんご": 40
  "みかん": 25
  "ぶどう": 20
  "バナナ": 15`

const parsePieDSL = (input: string): ParsedData | null => {
  try {
    const lines = input.trim().split('\n')

    if (!lines[0]?.includes('pie:')) {
      return null
    }

    const data: PieData[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()

      if (!line) continue

      const match = line.match(/^\s*"([^"]*)"\s*:\s*(\d+)\s*$/)

      if (match) {
        data.push({
          label: match[1],
          value: parseInt(match[2], 10),
        })
      }
    }

    return { type: 'pie', data }
  } catch {
    return null
  }
}

const CustomRatioGraph: React.FC = () => {
  const [dslText, setDslText] = useState(defaultDSL)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)

  React.useEffect(() => {
    const parsed = parsePieDSL(dslText)

    setParsedData(parsed)
  }, [dslText])

  const total = parsedData?.data.reduce((sum, item) => sum + item.value, 0) || 0

  return (
    <Layout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          カスタム割合グラフ
        </Typography>

        <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              DSL入力
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              value={dslText}
              onChange={(e) => setDslText(e.target.value)}
            />
          </Box>

          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              円グラフ
            </Typography>
            <Paper
              elevation={2}
              style={{ padding: '20px', minHeight: '300px' }}
            >
              {parsedData ? (
                <svg width="300" height="300" viewBox="0 0 300 300">
                  <g transform="translate(150, 150)">
                    {parsedData.data.map((item, index) => {
                      let startAngle = 0

                      for (let i = 0; i < index; i++) {
                        startAngle += (parsedData.data[i].value / total) * 360
                      }
                      const endAngle = startAngle + (item.value / total) * 360

                      const startAngleRad = (startAngle * Math.PI) / 180
                      const endAngleRad = (endAngle * Math.PI) / 180

                      const radius = 100
                      const x1 = radius * Math.cos(startAngleRad)
                      const y1 = radius * Math.sin(startAngleRad)
                      const x2 = radius * Math.cos(endAngleRad)
                      const y2 = radius * Math.sin(endAngleRad)

                      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                      const pathData = [
                        'M',
                        0,
                        0,
                        'L',
                        x1,
                        y1,
                        'A',
                        radius,
                        radius,
                        0,
                        largeArcFlag,
                        1,
                        x2,
                        y2,
                        'Z',
                      ].join(' ')

                      const colors = [
                        '#FF6B6B',
                        '#4ECDC4',
                        '#45B7D1',
                        '#96CEB4',
                        '#FECA57',
                        '#FF9FF3',
                        '#A8E6CF',
                      ]

                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          stroke="white"
                          strokeWidth="2"
                        />
                      )
                    })}
                  </g>
                </svg>
              ) : (
                <Typography color="error">DSL解析エラー</Typography>
              )}
            </Paper>
          </Box>
        </Box>

        {parsedData && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              データ詳細
            </Typography>
            <Paper elevation={1} style={{ padding: '20px' }}>
              {parsedData.data.map((item, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography>{item.label}</Typography>
                  <Typography>
                    {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
              ))}
              <Box mt={2} pt={2} borderTop="1px solid #ccc">
                <Typography>
                  <strong>合計: {total}</strong>
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            DSL仕様
          </Typography>
          <Paper elevation={1} style={{ padding: '20px' }}>
            <Typography component="pre" style={{ whiteSpace: 'pre-wrap' }}>
              {`pie:
  "ラベル1": 数値1
  "ラベル2": 数値2
  ...`}
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Layout>
  )
}

export default CustomRatioGraph
