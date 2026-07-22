import {
  computeCurve,
  convexHull,
  loopInfo,
  trianglePerimeter,
} from '../../components/NailLoopCurve/geometry'

const nails = [
  { x: 280, y: 84 },
  { x: 90, y: 442 },
  { x: 470, y: 442 },
]

describe('NailLoopCurve geometry', () => {
  test('凸包から内側の点を除外する', () => {
    const hull = convexHull([
      { x: 0, y: 0, tag: 0 },
      { x: 10, y: 0, tag: 1 },
      { x: 0, y: 10, tag: 2 },
      { x: 2, y: 2, tag: 3 },
    ])

    expect(hull.map((point) => point.tag).sort()).toEqual([0, 1, 2])
  })

  test('鉛筆が三角形の内側なら輪の長さは三角形の周長になる', () => {
    const info = loopInfo(nails, { x: 280, y: 300 })

    expect(info.perimeter).toBeCloseTo(trianglePerimeter(nails))
    expect(info.foci).toEqual([])
  })

  test('計算した軌跡上では輪の全長が一定になる', () => {
    const curve = computeCurve(nails, 90)

    expect(curve.points).toHaveLength(380)
    expect(curve.loopLength).toBeCloseTo(curve.trianglePerimeter + 90)
    curve.points
      .filter((_, index) => index % 38 === 0)
      .forEach((point) => {
        expect(loopInfo(nails, point).perimeter).toBeCloseTo(
          curve.loopLength,
          6
        )
      })
  })
})
