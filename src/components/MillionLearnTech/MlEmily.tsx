import { MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import { Box } from '../common/mui'
import { Card } from './Card'

const t: Record<string, Record<string, string>> = {
  ja: {
    title: 'エミリー',
    description: '国際化',
    milionArmer: 'ミリオンアーマー',
  },
  en: {
    title: 'Emily',
    description: 'Internationalization',
    milionArmer: 'Million Armer',
  },
  emi: {
    title: 'エミリー語',
    description: '国際化',
    milionArmer: '百万装甲',
  },
}

export const MlEmily = () => {
  const [lang, setLang] = useState<string>('ja')

  return (
    <Card>
      <h2>Emily</h2>
      <p>国際化</p>

      <Select value={lang} onChange={(e) => setLang(e.target.value)}>
        <MenuItem value="ja">日本語</MenuItem>
        <MenuItem value="en">英語</MenuItem>
        <MenuItem value="emi">エミリー</MenuItem>
      </Select>

      <Box>
        <Card>
          <h3>{t[lang].title}</h3>
          <p>{t[lang].description}</p>
          <p>{t[lang].milionArmer}</p>
        </Card>
      </Box>
    </Card>
  )
}
