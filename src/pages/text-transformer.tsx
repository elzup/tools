import {
  Box,
  Button,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { generateTextDiagramTransformer } from '../lib/text-transformer/binaryPacketDiagramTransformer'
import { TextTransformer } from '../lib/text-transformer/index'
import { TransformResult } from '../lib/text-transformer/transformer'

const TextTransformerPage = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [selectedTransformer, setSelectedTransformer] = useState<string>(
    'generateTextDiagram'
  )
  const [outputFontMono, setOutputFontMono] = useState(false)

  const transformers: TextTransformer[] = [
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
    { name: 'generateTextDiagram', transform: generateTextDiagramTransformer },
  ]

  const handleTransform = () => {
    // 選択された変換器に基づいてテキストを変換
    const transformer = transformers.find((t) => t.name === selectedTransformer)

    if (!transformer) {
      setOutputText('Transformer not found')
      return
    }

    const result = transformer.transform(inputText)

    if (typeof result === 'string') {
      setOutputText(result)
    } else if (result && typeof result === 'object' && 'diagram' in result) {
      setOutputText(result.diagram || '')
    } else {
      setOutputText('変換に失敗しました')
    }
  }

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
        <InputLabel id="transformer-select-label">変換器</InputLabel>
        <Select
          labelId="transformer-select-label"
          id="transformer-select"
          value={selectedTransformer}
          label="変換器"
          onChange={(e) => setSelectedTransformer(e.target.value)}
        >
          {transformers.map((transformer) => (
            <MenuItem key={transformer.name} value={transformer.name}>
              {transformer.name}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleTransform}>
          変換実行
        </Button>
      </Box>
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
