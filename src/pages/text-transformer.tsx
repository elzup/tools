import { Box, Button, InputLabel, Switch, TextField } from '@mui/material'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { createTextDiagramTransformer } from '../lib/text-transformer/binaryPacketDiagramTransformer'
import { TextTransformer } from '../lib/text-transformer/index'
import { TransformResult } from '../lib/text-transformer/transformer'

const BINARY_PACKET_MODE_NAME = 'binaryPacketDiagram'
const DEFAULT_MAX_BYTES_PER_LINE = 12

const TextTransformerPage = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [selectedTransformer, setSelectedTransformer] = useState<string>(
    BINARY_PACKET_MODE_NAME
  )
  const [outputFontMono, setOutputFontMono] = useState(false)
  const [maxBytesPerLine, setMaxBytesPerLine] = useState<number>(
    DEFAULT_MAX_BYTES_PER_LINE
  )

  const binaryPacketTransformer = useMemo(
    () => createTextDiagramTransformer({ maxBytesPerLine }),
    [maxBytesPerLine]
  )

  const transformers: TextTransformer[] = useMemo(
    () => [
      {
        name: 'toUpperCase',
        transform: (text: string): TransformResult => ({
          success: true,
          diagram: text.toUpperCase(),
        }),
      },
      {
        name: 'toLowerCase',
        transform: (text: string): TransformResult => ({
          success: true,
          diagram: text.toLowerCase(),
        }),
      },
      { name: BINARY_PACKET_MODE_NAME, transform: binaryPacketTransformer },
    ],
    [binaryPacketTransformer]
  )

  const handleMaxBytesPerLineChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue = parseInt(event.target.value, 10)

    if (Number.isNaN(nextValue)) {
      setMaxBytesPerLine(DEFAULT_MAX_BYTES_PER_LINE)
      return
    }

    setMaxBytesPerLine(nextValue > 0 ? nextValue : DEFAULT_MAX_BYTES_PER_LINE)
  }

  // inputTextまたはselectedTransformerが変更されたときに変換を実行
  useEffect(() => {
    if (!inputText) {
      setOutputText('')
      return
    }

    const transformer = transformers.find(
      (item) => item.name === selectedTransformer
    )

    if (!transformer) {
      setOutputText('Transformer not found')
      return
    }

    const result = transformer.transform(inputText)

    if (typeof result === 'string') {
      setOutputText(result)
      return
    }

    if (!result.success) {
      setOutputText(result.error || '変換に失敗しました')
      return
    }

    setOutputText(result.diagram || '')
  }, [inputText, selectedTransformer, transformers])

  return (
    <Layout title="テキスト変換ツール">
      <Title>テキスト変換ツール</Title>
      <Box mt={2}>
        <TextField
          label="入力テキスト"
          multiline
          fullWidth
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          variant="outlined"
        />
      </Box>
      <Box mt={2}>
        <InputLabel id="transformer-radio-group-label">変換器</InputLabel>
        <Box style={{ display: 'flex', flexDirection: 'row' }}>
          {transformers.map((transformer) => (
            <Box
              key={transformer.name}
              display="flex"
              alignItems="center"
              mb={1}
            >
              <input
                type="radio"
                id={`transformer-${transformer.name}`}
                name="transformer"
                value={transformer.name}
                checked={selectedTransformer === transformer.name}
                onChange={() => setSelectedTransformer(transformer.name)}
                style={{ marginRight: 8 }}
              />
              <label htmlFor={`transformer-${transformer.name}`}>
                {transformer.name}
              </label>
            </Box>
          ))}
        </Box>
      </Box>
      {selectedTransformer === BINARY_PACKET_MODE_NAME && (
        <Box mt={2}>
          <TextField
            label="maxBytesPerLine"
            type="number"
            inputProps={{ min: 1 }}
            value={maxBytesPerLine}
            onChange={handleMaxBytesPerLineChange}
          />
        </Box>
      )}
      {/* 変換はリアルタイムで行われるため、ボタンは不要 */}
      <Box mt={2}>
        <Box display="flex" alignItems="center" mb={1}>
          <Button
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
            onClick={() => setOutputFontMono((prev) => !prev)}
          >
            <Switch checked={outputFontMono} size="small" /> 等幅
          </Button>
        </Box>
        <TextField
          label="出力テキスト"
          multiline
          fullWidth
          rows={6}
          value={outputText}
          InputProps={{
            readOnly: true,
            style: { fontFamily: outputFontMono ? 'monospace' : undefined },
          }}
          variant="outlined"
        />
      </Box>
    </Layout>
  )
}

export default TextTransformerPage
