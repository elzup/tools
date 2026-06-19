import {
  Box,
  Chip,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import styled from 'styled-components'

type FilterDef = {
  key: string
  label: string
  min: number
  max: number
  step: number
  def: number
  toCss: (value: number) => string
}

// レンズ内に適用する CSS filter のプリセット
const FILTERS: FilterDef[] = [
  {
    key: 'blur',
    label: 'ぼかし',
    min: 0,
    max: 20,
    step: 0.5,
    def: 6,
    toCss: (v) => `blur(${v}px)`,
  },
  {
    key: 'invert',
    label: '色反転',
    min: 0,
    max: 1,
    step: 0.05,
    def: 1,
    toCss: (v) => `invert(${v})`,
  },
  {
    key: 'grayscale',
    label: 'モノクロ',
    min: 0,
    max: 1,
    step: 0.05,
    def: 1,
    toCss: (v) => `grayscale(${v})`,
  },
  {
    key: 'sepia',
    label: 'セピア',
    min: 0,
    max: 1,
    step: 0.05,
    def: 1,
    toCss: (v) => `sepia(${v})`,
  },
  {
    key: 'hue',
    label: '色相回転',
    min: 0,
    max: 360,
    step: 5,
    def: 180,
    toCss: (v) => `hue-rotate(${v}deg)`,
  },
  {
    key: 'contrast',
    label: 'コントラスト',
    min: 0,
    max: 4,
    step: 0.1,
    def: 2.4,
    toCss: (v) => `contrast(${v})`,
  },
  {
    key: 'saturate',
    label: '彩度',
    min: 0,
    max: 6,
    step: 0.1,
    def: 4,
    toCss: (v) => `saturate(${v})`,
  },
  {
    key: 'bright',
    label: '明るさ',
    min: 0,
    max: 3,
    step: 0.1,
    def: 1.8,
    toCss: (v) => `brightness(${v})`,
  },
]

const BLEND_MODES = [
  'normal',
  'difference',
  'multiply',
  'screen',
  'exclusion',
] as const
type BlendMode = (typeof BLEND_MODES)[number]

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80'

type LensState = {
  x: number
  y: number
  visible: boolean
}

const FilterLens = () => {
  const stageRef = useRef<HTMLDivElement>(null)
  const [filterKey, setFilterKey] = useState('blur')
  const [value, setValue] = useState(6)
  const [radius, setRadius] = useState(30)
  const [blend, setBlend] = useState<BlendMode>('normal')
  const [lens, setLens] = useState<LensState>({ x: 0, y: 0, visible: false })

  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]

  const handleSelectFilter = (key: string) => {
    const next = FILTERS.find((f) => f.key === key)
    if (!next) return
    setFilterKey(key)
    setValue(next.def)
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setLens({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    })
  }

  const filterCss = filter.toCss(value)

  return (
    <Wrap>
      <Controls>
        <Box>
          <Label>フィルター</Label>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                color={f.key === filterKey ? 'primary' : 'default'}
                variant={f.key === filterKey ? 'filled' : 'outlined'}
                onClick={() => handleSelectFilter(f.key)}
                size="small"
              />
            ))}
          </Stack>
        </Box>

        <SliderRow>
          <Label>
            強さ <code>{filterCss}</code>
          </Label>
          <Slider
            value={value}
            min={filter.min}
            max={filter.max}
            step={filter.step}
            onChange={(_, v) => setValue(v as number)}
            valueLabelDisplay="auto"
            size="small"
          />
        </SliderRow>

        <SliderRow>
          <Label>レンズ半径 {radius}px</Label>
          <Slider
            value={radius}
            min={10}
            max={160}
            step={1}
            onChange={(_, v) => setRadius(v as number)}
            valueLabelDisplay="auto"
            size="small"
          />
        </SliderRow>

        <Box>
          <Label>mix-blend-mode (レンズ自体の混色)</Label>
          <ToggleButtonGroup
            value={blend}
            exclusive
            size="small"
            onChange={(_, v: BlendMode | null) => v && setBlend(v)}
          >
            {BLEND_MODES.map((m) => (
              <ToggleButton key={m} value={m}>
                {m}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Controls>

      <Stage
        ref={stageRef}
        onPointerMove={handleMove}
        onPointerLeave={() => setLens((s) => ({ ...s, visible: false }))}
      >
        {/* 画像 + element が混在したサンプル: どちらにもレンズが効くのを見せる */}
        <img src={SAMPLE_IMAGE} alt="sample" draggable={false} />
        <Overlay>
          <h2>Filter Lens</h2>
          <p>画像の上にある「文字」や「図形」にもレンズが効きます。</p>
          <Swatches>
            <span style={{ background: '#ff5252' }} />
            <span style={{ background: '#40c4ff' }} />
            <span style={{ background: '#69f0ae' }} />
            <span style={{ background: '#ffd740' }} />
            <span style={{ background: '#e040fb' }} />
          </Swatches>
        </Overlay>

        {lens.visible && (
          <Lens
            style={{
              left: lens.x,
              top: lens.y,
              width: radius * 2,
              height: radius * 2,
              backdropFilter: filterCss,
              WebkitBackdropFilter: filterCss,
              mixBlendMode: blend,
            }}
          />
        )}
      </Stage>

      <Note>
        <Typography variant="body2">
          手法: カーソルに追従する円形の <code>div</code> に{' '}
          <code>backdrop-filter</code> を掛けているだけ。背後のコンテンツ
          (画像・テキスト・図形すべて)
          に対して、その円の範囲だけフィルターが適用されます。
          <br />
          画像専用にやるなら「同じ画像を2枚重ねて、上の filter 済みレイヤーを{' '}
          <code>mask: radial-gradient(circle 30px at マウス座標, …)</code>{' '}
          で円形に切り抜く」手もあります。
        </Typography>
      </Note>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Label = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    background: rgba(127, 127, 127, 0.15);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
  }
`

const SliderRow = styled.div`
  max-width: 420px;
`

const Stage = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  border-radius: 12px;
  overflow: hidden;
  cursor: crosshair;
  background: #111;
  user-select: none;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  padding: 1.5rem;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;

  h2 {
    margin: 0;
    font-size: clamp(1.5rem, 5vw, 3rem);
  }

  p {
    margin: 0.25rem 0 1rem;
    font-size: clamp(0.8rem, 2.5vw, 1.1rem);
  }
`

const Swatches = styled.div`
  display: flex;
  gap: 0.5rem;

  span {
    width: clamp(28px, 8vw, 56px);
    height: clamp(28px, 8vw, 56px);
    border-radius: 8px;
    display: block;
  }
`

const Lens = styled.div`
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.7),
    0 4px 16px rgba(0, 0, 0, 0.4);
`

const Note = styled.div`
  opacity: 0.85;

  code {
    background: rgba(127, 127, 127, 0.15);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.8em;
  }
`

export default FilterLens
