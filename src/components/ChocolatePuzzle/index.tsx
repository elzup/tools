import { Button } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

// チョコレートの「欠片が一つ余る」パズル = Curry のパラドックス。
// 同じ 4 ピースを手でドラッグし、左の正方形ゾーン(8x8=64)と
// 右の長方形ゾーン(13x5=65)に置き換えて確かめる。
// ピースを各ゾーンの定位置近くで離すと、正しい向きにスナップする。

type Pt = [number, number]
type Affine = {
  a: number
  b: number
  tx: number
  c: number
  d: number
  ty: number
}

type Piece = {
  sq: Pt[] // 正方形配置 (8x8 座標, 左下原点 y上)
  rect: Pt[] // 長方形配置 (13x5 座標)
  color: string
}

// 検証済み: rect 4 ピースは 13x5 を隙間ちょうど1マスで充填。
const PIECES: Piece[] = [
  {
    sq: [
      [0, 0],
      [8, 0],
      [8, 3],
    ],
    rect: [
      [0, 0],
      [8, 0],
      [8, 3],
    ],
    color: '#6d4226',
  },
  {
    sq: [
      [0, 3],
      [0, 0],
      [8, 3],
    ],
    rect: [
      [5, 5],
      [5, 2],
      [13, 5],
    ],
    color: '#9a6a40',
  },
  {
    sq: [
      [0, 3],
      [3, 3],
      [5, 8],
      [0, 8],
    ],
    rect: [
      [5, 5],
      [5, 2],
      [0, 0],
      [0, 5],
    ],
    color: '#5a3620',
  },
  {
    sq: [
      [8, 3],
      [8, 8],
      [5, 8],
      [3, 3],
    ],
    rect: [
      [13, 0],
      [8, 0],
      [8, 3],
      [13, 5],
    ],
    color: '#80532f',
  },
]

const UNIT = 20
const SQ_ORG: Pt = [24, 196] // 正方形ゾーンの原点(左下)
const RECT_ORG: Pt = [212, 196] // 長方形ゾーンの原点(左下)
const CANVAS_W = 500
const CANVAS_H = 232
const SNAP_DIST = 64 // この距離以内で離すと定位置にスナップ

const IDENT: Affine = { a: 1, b: 0, tx: 0, c: 0, d: 1, ty: 0 }

const solveAffine = (sq: Pt[], rect: Pt[]): Affine => {
  const [p0, p1, p2] = sq
  const [q0, q1, q2] = rect
  const det =
    (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1])
  const solve = (f0: number, f1: number, f2: number) => {
    const g1 = f1 - f0
    const g2 = f2 - f0
    const m = (g1 * (p2[1] - p0[1]) - g2 * (p1[1] - p0[1])) / det
    const n = (g2 * (p1[0] - p0[0]) - g1 * (p2[0] - p0[0])) / det

    return [m, n, f0 - m * p0[0] - n * p0[1]] as const
  }
  const [a, b, tx] = solve(q0[0], q1[0], q2[0])
  const [c, d, ty] = solve(q0[1], q1[1], q2[1])

  return { a, b, tx, c, d, ty }
}

const AFFINES = PIECES.map((p) => solveAffine(p.sq, p.rect))

const apply = (A: Affine, [x, y]: Pt): Pt => [
  A.a * x + A.b * y + A.tx,
  A.c * x + A.d * y + A.ty,
]

// math(左下 y上) -> canvas(左上 y下)。ゾーン原点を指定。
const toCanvas = ([x, y]: Pt, [ox, oy]: Pt): Pt => [
  ox + x * UNIT,
  oy - y * UNIT,
]

type Pose = 'sq' | 'rect'

// ピースの現在ポーズの canvas 多角形 (dx,dy 平行移動込み)
const posePoly = (i: number, pose: Pose, dx: number, dy: number): Pt[] => {
  const A = pose === 'sq' ? IDENT : AFFINES[i]
  const org = pose === 'sq' ? SQ_ORG : RECT_ORG

  return PIECES[i].sq.map((p) => {
    const [cx, cy] = toCanvas(apply(A, p), org)

    return [cx + dx, cy + dy]
  })
}

const centroid = (poly: Pt[]): Pt => {
  const n = poly.length

  return [
    poly.reduce((s, p) => s + p[0], 0) / n,
    poly.reduce((s, p) => s + p[1], 0) / n,
  ]
}

const pointInPoly = (px: number, py: number, poly: Pt[]): boolean => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      c = !c
  }

  return c
}

type PState = { pose: Pose; dx: number; dy: number }

const ChocolatePuzzle = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [, force] = useState(0)

  // 各ピースの状態 (初期は全て正方形ゾーン)
  const pieces = useRef<PState[]>(
    PIECES.map(() => ({ pose: 'sq', dx: 0, dy: 0 }))
  )
  const drag = useRef<{
    i: number
    startX: number
    startY: number
    baseDx: number
    baseDy: number
  } | null>(null)

  const countRect = () =>
    pieces.current.filter((p) => p.pose === 'rect' && p.dx === 0 && p.dy === 0)
      .length

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d') ?? null
    if (!ctx) return

    let raf = 0
    const loop = () => {
      // ドラッグ外は dx,dy を 0 へ寄せて定位置へ吸着
      pieces.current.forEach((p, i) => {
        if (drag.current?.i === i) return
        p.dx += (0 - p.dx) * 0.25
        p.dy += (0 - p.dy) * 0.25
        if (Math.abs(p.dx) < 0.3) p.dx = 0
        if (Math.abs(p.dy) < 0.3) p.dy = 0
      })
      draw(ctx, pieces.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf)
  }, [])

  const toCanvasPt = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    return [
      ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    ]
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [px, py] = toCanvasPt(e)
    // 上に描かれている(後の)ピースを優先
    for (let i = PIECES.length - 1; i >= 0; i--) {
      const p = pieces.current[i]
      if (pointInPoly(px, py, posePoly(i, p.pose, p.dx, p.dy))) {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { i, startX: px, startY: py, baseDx: p.dx, baseDy: p.dy }

        return
      }
    }
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current
    if (!d) return
    const [px, py] = toCanvasPt(e)
    const p = pieces.current[d.i]
    p.dx = d.baseDx + (px - d.startX)
    p.dy = d.baseDy + (py - d.startY)
  }

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current
    if (!d) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const p = pieces.current[d.i]

    // どちらのゾーンの定位置に近いか判定してスナップ
    const cur = centroid(posePoly(d.i, p.pose, p.dx, p.dy))
    const sqC = centroid(posePoly(d.i, 'sq', 0, 0))
    const rectC = centroid(posePoly(d.i, 'rect', 0, 0))
    const dSq = Math.hypot(cur[0] - sqC[0], cur[1] - sqC[1])
    const dRect = Math.hypot(cur[0] - rectC[0], cur[1] - rectC[1])

    if (dSq <= SNAP_DIST || dRect <= SNAP_DIST) {
      p.pose = dRect < dSq ? 'rect' : 'sq'
    }
    // 近くのスロットが無ければ現ポーズへ吸着(dx,dy が 0 に戻る)
    p.dx = 0
    p.dy = 0
    drag.current = null
    force((n) => n + 1)
  }

  const allTo = (pose: Pose) => {
    pieces.current.forEach((p) => {
      p.pose = pose
      p.dx = 0
      p.dy = 0
    })
    force((n) => n + 1)
  }

  const inRect = countRect()
  const status =
    inRect === 4
      ? '13×5 = 65 マス — 同じ4枚なのに 1 マス増えた'
      : inRect === 0
      ? '8×8 = 64 マス'
      : `長方形に ${inRect} / 4 枚`

  return (
    <Wrap>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          width: '100%',
          maxWidth: CANVAS_W,
          borderRadius: 8,
          touchAction: 'none',
          cursor: 'grab',
        }}
      />

      <Controls>
        <Status $done={inRect === 4}>{status}</Status>
        <Row>
          <Button variant="outlined" size="small" onClick={() => allTo('sq')}>
            正方形に戻す
          </Button>
          <Button variant="outlined" size="small" onClick={() => allTo('rect')}>
            長方形に揃える
          </Button>
        </Row>
        <Hint>
          チョコの欠片を左の<strong>正方形(64マス)</strong>から右の
          <strong>長方形(65マス)</strong>へドラッグして並べ替えてみてください。
        </Hint>
      </Controls>
    </Wrap>
  )
}

// ---- 描画 ----

const draw = (ctx: CanvasRenderingContext2D, states: PState[]) => {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = '#1b1b1f'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // ゾーンのガイド枠
  guideRect(ctx, SQ_ORG, 8, 8, '8×8')
  guideRect(ctx, RECT_ORG, 13, 5, '13×5')

  // 置き先ガイド: 各ピースが今いない側に、収まる位置のゴーストを薄く描く
  states.forEach((st, i) => {
    const other: Pose = st.pose === 'sq' ? 'rect' : 'sq'
    drawGhost(ctx, i, other)
  })

  states.forEach((st, i) => {
    const poly = posePoly(i, st.pose, st.dx, st.dy)
    const A = st.pose === 'sq' ? IDENT : AFFINES[i]
    const org = st.pose === 'sq' ? SQ_ORG : RECT_ORG
    const off: Pt = [st.dx, st.dy]

    ctx.save()
    pathPoly(ctx, poly)
    ctx.fillStyle = PIECES[i].color
    ctx.fill()

    // チョコの溝 (整数グリッドをポーズ変換してクリップ描画)
    ctx.clip()
    ctx.strokeStyle = 'rgba(20,12,6,0.5)'
    ctx.lineWidth = 1.2
    for (let g = 0; g <= 8; g++) {
      const v1 = addp(toCanvas(apply(A, [g, 0]), org), off)
      const v2 = addp(toCanvas(apply(A, [g, 8]), org), off)
      const h1 = addp(toCanvas(apply(A, [0, g]), org), off)
      const h2 = addp(toCanvas(apply(A, [8, g]), org), off)
      line(ctx, v1, v2)
      line(ctx, h1, h2)
    }
    ctx.restore()

    // 外形(切り口)
    ctx.save()
    pathPoly(ctx, poly)
    ctx.strokeStyle = '#0f0d0b'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,210,160,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  })
}

// 置き先のゴースト (薄い塗り + 破線輪郭)
const drawGhost = (ctx: CanvasRenderingContext2D, i: number, pose: Pose) => {
  const poly = posePoly(i, pose, 0, 0)
  ctx.save()
  pathPoly(ctx, poly)
  ctx.fillStyle = PIECES[i].color
  ctx.globalAlpha = 0.16
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = 'rgba(255,235,210,0.35)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

const guideRect = (
  ctx: CanvasRenderingContext2D,
  [ox, oy]: Pt,
  w: number,
  h: number,
  label: string
) => {
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.strokeRect(ox, oy - h * UNIT, w * UNIT, h * UNIT)
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(label, ox, oy - h * UNIT - 6)
}

const addp = ([x, y]: Pt, [dx, dy]: Pt): Pt => [x + dx, y + dy]

const pathPoly = (ctx: CanvasRenderingContext2D, poly: Pt[]) => {
  ctx.beginPath()
  poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
}

const line = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt) => {
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
`

const Controls = styled.div`
  flex: 1;
  min-width: 260px;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Status = styled.div<{ $done: boolean }>`
  padding: 8px 12px;
  border-radius: 6px;
  background: ${(p) => (p.$done ? '#6d4c1b' : '#333')};
  color: #fff;
  font-weight: 600;
  transition: background 0.2s;
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const Hint = styled.p`
  font-size: 13px;
  line-height: 1.7;
  color: #666;
  margin: 0;
`

export default ChocolatePuzzle
