import { useState } from 'react'
import { GRAY_CODE_BITS, GRAY_CODE_PERIOD, fromGrayCode } from './GrayCodeStrip'
import { Modal } from './Modal'
import type { Theme } from './themes'

type Props = {
  isOpen: boolean
  onClose: () => void
  theme: Theme
  frameMs: number | null
}

const EMPTY_BITS: boolean[] = Array.from(
  { length: GRAY_CODE_BITS },
  () => false
)

function bitsToGray(bits: boolean[]): number {
  return bits.reduce((acc, isOn) => (acc << 1) | (isOn ? 1 : 0), 0)
}

// 写真のブロック列と同じ並び (左が上位ビット) でマスを押して写し取る
function BitRow({
  label,
  bits,
  onToggle,
}: {
  label: string
  bits: boolean[]
  onToggle: (index: number) => void
}) {
  const frame = fromGrayCode(bitsToGray(bits))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>F{String(frame).padStart(4, '0')}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {bits.map((isOn, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={isOn}
            aria-label={`${label} bit ${GRAY_CODE_BITS - 1 - index}`}
            onClick={() => onToggle(index)}
            style={{
              flex: 1,
              aspectRatio: '1',
              minWidth: 0,
              padding: 0,
              // 文字の無いマスなので、どの状態でも塗りと枠だけで判別できる
              backgroundColor: isOn ? 'currentColor' : 'transparent',
              color: 'inherit',
              border: '2px solid currentColor',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function DelayModal({ isOpen, onClose, theme, frameMs }: Props) {
  const [sourceBits, setSourceBits] = useState(EMPTY_BITS)
  const [streamBits, setStreamBits] = useState(EMPTY_BITS)

  const toggle = (bits: boolean[], index: number) =>
    bits.map((isOn, i) => (i === index ? !isOn : isOn))

  const frameA = fromGrayCode(bitsToGray(sourceBits))
  const frameB = fromGrayCode(bitsToGray(streamBits))
  // ストリームは必ず元の画面より遅れる。入力の順番を問わないよう、周回差の小さい向きを遅延とみなす
  const diffAB = (frameA - frameB + GRAY_CODE_PERIOD) % GRAY_CODE_PERIOD
  const isAAhead = diffAB <= GRAY_CODE_PERIOD / 2
  const delayFrames = isAAhead ? diffAB : GRAY_CODE_PERIOD - diffAB
  const maxDelaySec =
    frameMs === null
      ? null
      : Math.round(((GRAY_CODE_PERIOD / 2) * frameMs) / 1000)

  return (
    <Modal isOpen={isOpen} title="Delay" onClose={onClose} theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          写真の 2 つのブロック列を写し取る。どちらに入力してもよい
        </div>
        <BitRow
          label="A"
          bits={sourceBits}
          onToggle={(index) => setSourceBits((bits) => toggle(bits, index))}
        />
        <BitRow
          label="B"
          bits={streamBits}
          onToggle={(index) => setStreamBits((bits) => toggle(bits, index))}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '1rem',
            borderTop: `2px solid ${theme.TEXT_COLOR}`,
            paddingTop: '0.75rem',
          }}
        >
          <span>
            {delayFrames === 0
              ? '遅延なし'
              : isAAhead
                ? 'B が A より遅れている'
                : 'A が B より遅れている'}
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>
            {delayFrames} F
            {frameMs !== null && ` = ${(delayFrames * frameMs).toFixed(1)} ms`}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          ±1 F の誤差を含む。{GRAY_CODE_PERIOD / 2} F (約 {maxDelaySec ?? '?'}{' '}
          秒) を超える遅延は区別できない
        </div>
        <button
          type="button"
          onClick={() => {
            setSourceBits(EMPTY_BITS)
            setStreamBits(EMPTY_BITS)
          }}
          style={{
            alignSelf: 'flex-end',
            background: 'transparent',
            color: theme.TEXT_COLOR,
            border: `2px solid ${theme.TEXT_COLOR}`,
            borderRadius: '4px',
            padding: '0.3rem 0.8rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </Modal>
  )
}
