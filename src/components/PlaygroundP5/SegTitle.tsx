const cr1 = [0, 0]
const cr2 = [0, 2]
const cr3 = [0, 5]
const cl1 = [1, 0]
const cl2 = [1, 1]
const cl3 = [1, 5]
const pad = 0.4
const coods = [
  [
    [cr1[0], cr1[1] + pad],
    [cr2[0], cr2[1] - pad],
  ],
  [
    [cr2[0], cr2[1] + pad],
    [cr3[0], cr3[1] - pad],
  ],
  [
    [cr1[0] + pad, cr1[1]],
    [cl1[0] - pad, cl1[1]],
  ],
  [
    [cr2[0] + pad, cr2[1] + pad],
    [cl2[0] - pad, cl2[1] - pad],
  ],
  [
    [cr2[0] + pad, cr2[1] + pad],
    [cl3[0] - pad, cl3[1] - pad],
  ],
  [
    [cr3[0] + pad, cr3[1]],
    [cl3[0] - pad, cl3[1]],
  ],
]
const list = ['111000', '110000']

export const SegTitle = () => {
  return (
    <svg
      width="200"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="-20 -20 200 200"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="1"
          markerHeight="1"
          refX="0"
          refY="0.5"
          orient="auto"
        >
          <polygon points="0 0, 1 0.5, 0 1" />
        </marker>
        <marker
          id="arrowtail"
          markerWidth="1"
          markerHeight="1"
          refX="1"
          refY="0.5"
          orient="auto"
        >
          <polygon points="1 0, 0 0.5, 10 10" />
        </marker>
      </defs>

      {list.map(([..._seg], i) =>
        coods.map(([[x1, y1], [x2, y2]], j) => (
          <line
            key={j}
            x1={x1 * 20 + i * 40}
            y1={y1 * 20}
            x2={x2 * 20 + i * 40}
            y2={y2 * 20}
            stroke="black"
            strokeWidth={7}
            marker-end="url(#arrowhead)"
            marker-start="url(#arrowtail)"
          />
        ))
      )}
    </svg>
  )
}
