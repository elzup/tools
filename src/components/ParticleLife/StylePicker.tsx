import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material'
import styled from 'styled-components'
import {
  DRAW_STYLES,
  type DrawStyle,
  STYLE_INFO,
  STYLE_PRESETS,
} from './render'

type Props = {
  typeCount: number
  styles: DrawStyle[]
  onChange: (styles: DrawStyle[]) => void
  colorOf: (t: number, n: number) => string
}

const StylePicker = ({ typeCount, styles, onChange, colorOf }: Props) => {
  const setOne = (t: number, s: DrawStyle) =>
    onChange(styles.map((cur, i) => (i === t ? s : cur)))

  // 種類数を超える分は保持しておき、種類を増やしたときに前の割り当てを戻せるようにする
  const applyPreset = (make: (n: number) => DrawStyle[]) => {
    const head = make(typeCount)

    onChange(styles.map((cur, i) => head[i] ?? cur))
  }

  return (
    <Wrap>
      <Presets>
        {STYLE_PRESETS.map((p) => (
          <Button
            key={p.name}
            size="small"
            variant="outlined"
            onClick={() => applyPreset(p.make)}
          >
            {p.name}
          </Button>
        ))}
      </Presets>
      {Array.from({ length: typeCount }, (_, t) => (
        <Row key={t}>
          <Swatch style={{ background: colorOf(t, typeCount) }} />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={styles[t]}
            onChange={(_, v: DrawStyle | null) => v && setOne(t, v)}
          >
            {DRAW_STYLES.map((s) => (
              <ToggleButton
                key={s}
                value={s}
                title={STYLE_INFO[s].name}
                sx={{ px: 0.9, py: 0.2, fontSize: '0.75rem' }}
              >
                {STYLE_INFO[s].short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Row>
      ))}
      <Legend>
        {DRAW_STYLES.map((s) => (
          <span key={s}>
            {STYLE_INFO[s].short}: {STYLE_INFO[s].name}
          </span>
        ))}
      </Legend>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Swatch = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  font-size: 0.72rem;
  color: #666;
`

export default StylePicker
