type Props = {
  w: number
}

export const Circle = ({ w }: Props) => {
  return <circle cx={0} cy={0} r={w / 2} />
}

export const Rect = ({ w }: Props) => {
  return <rect x={-w / 2} y={-w / 2} width={w} height={w} />
}

export const RectInCircle = ({ w }: Props) => {
  return <Rect w={w / Math.SQRT2} />
}
