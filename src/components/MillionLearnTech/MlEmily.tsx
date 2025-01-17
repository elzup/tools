import { MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import { Card } from './Card'

const t: Record<string, Record<string, string>> = {
  日本語: {
    title: 'エミリー',
    description: '国際化',
    milionArmer: 'ミリオンアーマー',
  },
  英語: {
    title: 'Emily',
    description: 'Internationalization',
    milionArmer: 'Million Armer',
  },
  エミリー: {
    title: 'エミリー',
    description: '国際化',
    milionArmer: '百万装甲',
  },
}

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
      <p>{t[lang].title}</p>
      <p>{t[lang].description}</p>
      <p>{t[lang].milionArmer}</p>
    </Card>
  )
}
