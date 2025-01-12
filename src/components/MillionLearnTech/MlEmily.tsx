import { MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import { Card } from './Card'

export const MlEmily = () => {
  const [lang, setLang] = useState<string>('日本語')

  return (
    <Card>
      <h2>Emily</h2>
      <p>国際化</p>
      <Select value={lang} onChange={(e) => setLang(e.target.value)}>
        <MenuItem value="日本語">日本語</MenuItem>
        <MenuItem value="英語">英語</MenuItem>
        <MenuItem value="エミリー">エミリー</MenuItem>
      </Select>
    </Card>
  )
}
