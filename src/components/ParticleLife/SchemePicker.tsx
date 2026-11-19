import styled from 'styled-components'
import { COLOR_SCHEMES } from './palette'

type Props = {
  value: number
  typeCount: number
  onChange: (index: number) => void
}

const SchemePicker = ({ value, typeCount, onChange }: Props) => (
  <Wrap>
    {COLOR_SCHEMES.map((s, i) => (
      <Chip
        key={s.name}
        type="button"
        aria-pressed={i === value}
        style={{ background: s.bg, color: s.fg }}
        onClick={() => onChange(i)}
      >
        <Dots>
          {Array.from({ length: typeCount }, (_, t) => (
            <i key={t} style={{ background: s.color(t, typeCount) }} />
          ))}
        </Dots>
        {s.name}
      </Chip>
    ))}
  </Wrap>
)

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

// 地と文字色は配色ごとに inline で決まるので、hover/選択は枠と明るさだけで示す
const Chip = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 5px 8px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 0.72rem;
  cursor: pointer;

  &:hover {
    filter: brightness(1.15);
  }
  &[aria-pressed='true'] {
    border-color: #1976d2;
  }
  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
`

const Dots = styled.span`
  display: flex;
  gap: 2px;

  i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
`

export default SchemePicker
