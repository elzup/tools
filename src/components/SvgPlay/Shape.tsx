export type Props = {
  w: number
}

export const Circle = ({ w }: Props) => {
  return <circle cx={0} cy={0} r={w / 2} />
}

export const Rect = ({ w }: Props) => {
  return <rect x={-w / 2} y={-w / 2} width={w} height={w} />
}
export const Donut = ({ w }: Props) => {
  return (
    <>
      <Circle w={w} />
      <Circle w={w / 2} />
    </>
  )
}
export const PadCircle = ({ w }: Props) => {
  return (
    <>
      <Circle w={w} />
      <SmallRect w={w} />
    </>
  )
}

export const SmallRect = ({ w }: Props) => {
  return <Rect w={w / Math.SQRT2} />
}

export const ShineCircle = ({ w }: Props) => {
  return (
    <>
      <Circle w={w * 1.1} />
      <Circle w={w} />
      {[0.1, 0.2, 0.3, 0.4, 0.5].map((i) => {
        const vx1 = (Math.cos(i) * w) / 2
        const vy1 = (Math.sin(i) * w) / 2

        return <line key={i} x1={vx1} y1={vy1} x2={-vx1} y2={-vy1} />
      })}
    </>
  )
}

const fanPath = (w: number) => `M 0,0 L ${w},0 a ${w} ${w} 0 0 1 -${w},${w} z`

export const Fan = ({ w }: Props) => {
  return <path d={fanPath(w)} />
}

const arkPath = (w: number) => `M ${w},0 A ${w} ${w} 0 0 1 0,${w}`

export const DraftFan = ({ w }: Props) => {
  const r = w * 0.714285714 * 0.7
  const path = `${arkPath(w * 0.7)} ${arkPath(
    w * 0.5
  )} M ${w},0 L 0,0 L 0,${w} M 0,0 L ${r},${r}`

  return <path d={path} />
}

export const ClockHand = ({ w }: Props) => {
  const r = w / 20

  return (
    <>
      <line x1={0} y1={0} x2={0} y2={w} />
      <circle cx={0} cy={w - 2 * r} r={r} />
    </>
  )
}

export const Cross = ({ w }: Props) => {
  return (
    <>
      <line x1={0} y1={0} x2={0} y2={w} />
      <line x1={-w / 4} y1={w / 2} x2={w / 4} y2={w / 2} />
    </>
  )
}
