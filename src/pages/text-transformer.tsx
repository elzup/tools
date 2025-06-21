import { useState } from 'react'
import { TextField, Button, Typography, Box } from '@mui/material'
import { toUpperCaseTransformer } from '../lib/text-transformer/index'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const TextTransformerPage = () => {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')

  const handleTransform = () => {
    // ここに変換ロジックを実装
    setOutputText(toUpperCaseTransformer(inputText))
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
        <Button variant="contained" color="primary" onClick={handleTransform}>
          変換実行
        </Button>
      </Box>
      <Box mt={2}>
        <TextField
          label="出力テキスト"
          multiline
          fullWidth
          rows={6}
          value={outputText}
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
        />
      </Box>
    </Layout>
  )
}

export default TextTransformerPage
