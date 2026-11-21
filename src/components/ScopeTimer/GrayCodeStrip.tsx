import type { RefObject } from 'react'

// 12 bit = 4096 フレーム。60Hz で約 68 秒で一周する。撮影 1 回分の区間を一意に読める長さ
export const GRAY_CODE_BITS = 12

// 12 マス + 11 隙間 = 80.8vmin。縦長画面でも左右の余白の内側に 1 行で収まる上限付近
const CELL_SIZE_VMIN = 6
const CELL_GAP_VMIN = 0.8

export function toGrayCode(value: number): number {
  return value ^ (value >> 1)
}

export function fromGrayCode(gray: number): number {
  // 上位ビットから順に XOR を累積する。12 bit なので 8 までのシフトで足りる
  const shifts = [1, 2, 4, 8]

  return shifts.reduce((acc, shift) => acc ^ (acc >> shift), gray)
}

export const GRAY_CODE_PERIOD = 2 ** GRAY_CODE_BITS

// 描画フレームごとに呼ぶ。React の再描画を挟むと 1 フレーム遅れるため DOM を直接書き換える
export function paintGrayCode(strip: HTMLElement, frame: number) {
  const gray = toGrayCode(frame % GRAY_CODE_PERIOD)
  const cells = Array.from(strip.children) as HTMLElement[]

  cells.forEach((cell, index) => {
    const bit = GRAY_CODE_BITS - 1 - index
    const isOn = ((gray >> bit) & 1) === 1

    cell.style.backgroundColor = isOn ? 'currentColor' : 'transparent'
  })
}

// 1 フレームで 1 マスしか変わらないので、2 フレームが重なって写っても誤差は 1 フレームに収まる
export function GrayCodeStrip({
  stripRef,
}: {
  stripRef: RefObject<HTMLDivElement>
}) {
  const bits = Array.from({ length: GRAY_CODE_BITS }, (_, i) => i)

  return (
    <div
      ref={stripRef}
      role="img"
      aria-label="描画フレーム番号 (グレイコード、左が上位ビット)"
      style={{ display: 'flex', gap: `${CELL_GAP_VMIN}vmin` }}
    >
      {bits.map((i) => (
        <div
          key={i}
          style={{
            width: `${CELL_SIZE_VMIN}vmin`,
            height: `${CELL_SIZE_VMIN}vmin`,
            border: '0.6vmin solid currentColor',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  )
}
