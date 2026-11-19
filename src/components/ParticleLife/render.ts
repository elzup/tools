import { type ColorScheme, toRgb } from './palette'
import type { World } from './particleLife'

// 種類 (色) ごとに描き方を選べる canvas 描画。シミュレーションとは独立で、描くだけ

export const DRAW_STYLES = [
  'dots',
  'glow',
  'trail',
  'streak',
  'links',
  'mono',
  'speedGlow',
  'crowdGlow',
] as const
export type DrawStyle = (typeof DRAW_STYLES)[number]

export const STYLE_INFO: Record<DrawStyle, { short: string; name: string }> = {
  dots: { short: '点', name: 'ドット' },
  glow: { short: '光', name: '発光 (加算合成)' },
  trail: { short: '残', name: '残像' },
  streak: { short: '筋', name: '速度の筋' },
  links: { short: '線', name: '近傍を結ぶ' },
  mono: { short: '淡', name: '淡いモノトーン' },
  speedGlow: { short: '速', name: '速いほど発光' },
  crowdGlow: { short: '密', name: '近傍が多いほど発光' },
}

export type StylePreset = {
  name: string
  make: (n: number) => DrawStyle[]
}

const half = (n: number) => Math.ceil(n / 2)

export const STYLE_PRESETS: StylePreset[] = [
  { name: '全部ドット', make: (n) => Array(n).fill('dots') },
  {
    name: '全部違う',
    make: (n) =>
      Array.from({ length: n }, (_, i) => DRAW_STYLES[i % DRAW_STYLES.length]),
  },
  {
    name: '1 色だけ発光',
    make: (n) =>
      Array.from({ length: n }, (_, i) => (i === 0 ? 'glow' : 'mono')),
  },
  {
    name: '動きで分ける',
    make: (n) =>
      Array.from({ length: n }, (_, i) => (i < half(n) ? 'streak' : 'trail')),
  },
  { name: '速さで光る', make: (n) => Array(n).fill('speedGlow') },
  { name: '密集で光る', make: (n) => Array(n).fill('crowdGlow') },
  {
    name: '構造と粒',
    make: (n) =>
      Array.from({ length: n }, (_, i) => (i < half(n) ? 'links' : 'dots')),
  },
  {
    name: 'ランダム',
    make: (n) =>
      Array.from(
        { length: n },
        () => DRAW_STYLES[Math.floor(Math.random() * DRAW_STYLES.length)]
      ),
  },
]

const DOT = 2
const SPRITE = 28
// 残像レイヤーを 1 フレームで消す割合。小さいほど尾が長い
const TRAIL_FADE = 0.14
// 速度 (空間幅/秒) を何秒ぶんの線にするか
const STREAK_SECONDS = 0.06
// 近傍を結ぶ距離 (rMax 比)。rMax そのままだと線で埋まって構造が見えない
const LINK_RATIO = 0.45
// これ以上の速さ (空間幅/秒) で最大の明るさ。既定パラメータ・1500 粒子の実測で中央値 0.05、上位 10% が 0.37 なので、速い 1 割だけが強く光る値にする
const SPEED_FULL = 0.3
// これ以上の近傍数で最大の明るさ。同条件の実測で中央値 75、上位 10% が 350 (塊の芯)
const CROWD_FULL = 300
// 明るさ 0 でも位置が分かるよう、暗い芯は常に描く
const DIM_ALPHA = 0.25

type DrawArgs = {
  world: World
  typeCount: number
  styles: DrawStyle[]
  rMax: number
  scheme: ColorScheme
}

const makeSprite = (color: string): HTMLCanvasElement => {
  const c = document.createElement('canvas')

  c.width = SPRITE
  c.height = SPRITE
  const g = c.getContext('2d')

  if (!g) return c
  const [r, gr, b] = toRgb(g, color)
  const mid = SPRITE / 2
  const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid)
  // 芯は白に寄せて「光っている」感じを出し、外側は元の色で減衰させる
  const core = (v: number) => Math.round(v + (255 - v) * 0.6)

  grad.addColorStop(0, `rgba(${core(r)}, ${core(gr)}, ${core(b)}, 0.95)`)
  grad.addColorStop(0.18, `rgba(${r}, ${gr}, ${b}, 0.55)`)
  grad.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, SPRITE, SPRITE)
  return c
}

// 明るい地に加算合成すると白飛びして消えるので、通常合成に落とす
const blend = (scheme: ColorScheme): GlobalCompositeOperation =>
  scheme.isLight ? 'source-over' : 'lighter'

type Pass = (g: CanvasRenderingContext2D, args: DrawArgs, t: number) => void

const eachOfType = (
  world: World,
  t: number,
  size: number,
  fn: (x: number, y: number, i: number) => void
) => {
  for (let i = 0; i < world.count; i++) {
    if (world.types[i] === t) fn(world.x[i] * size, world.y[i] * size, i)
  }
}

const createPasses = (
  size: number,
  sprite: (color: string) => HTMLCanvasElement
): Record<DrawStyle, Pass> => {
  const dots: Pass = (g, { world, typeCount, scheme }, t) => {
    g.fillStyle = scheme.color(t, typeCount)
    eachOfType(world, t, size, (x, y) =>
      g.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT)
    )
  }

  // level(i) が 1 に近いほど強く光る。0 付近は暗い点だけ
  const intensityGlow = (
    g: CanvasRenderingContext2D,
    { world, typeCount, scheme }: DrawArgs,
    t: number,
    level: (i: number) => number
  ) => {
    const sp = sprite(scheme.color(t, typeCount))

    g.fillStyle = scheme.color(t, typeCount)
    g.globalCompositeOperation = blend(scheme)
    eachOfType(world, t, size, (x, y, i) => {
      const a = Math.min(1, level(i))

      g.globalAlpha = DIM_ALPHA
      g.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT)
      if (a < 0.05) return
      g.globalAlpha = a
      g.drawImage(sp, x - SPRITE / 2, y - SPRITE / 2)
    })
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }

  return {
    dots,
    trail: dots,
    glow: (g, { world, typeCount, scheme }, t) => {
      const sp = sprite(scheme.color(t, typeCount))

      g.globalCompositeOperation = blend(scheme)
      eachOfType(world, t, size, (x, y) =>
        g.drawImage(sp, x - SPRITE / 2, y - SPRITE / 2)
      )
      g.globalCompositeOperation = 'source-over'
    },
    streak: (g, { world, typeCount, scheme }, t) => {
      const k = STREAK_SECONDS * size

      g.strokeStyle = scheme.color(t, typeCount)
      g.lineWidth = 1.6
      g.lineCap = 'round'
      g.beginPath()
      eachOfType(world, t, size, (x, y, i) => {
        g.moveTo(x, y)
        g.lineTo(x - world.vx[i] * k, y - world.vy[i] * k)
      })
      g.stroke()
    },
    links: (g, { world, typeCount, rMax, scheme }, t) => {
      const xs: number[] = []
      const ys: number[] = []

      eachOfType(world, t, size, (x, y) => {
        xs.push(x)
        ys.push(y)
      })
      const l2 = (rMax * size * LINK_RATIO) ** 2

      g.strokeStyle = scheme.color(t, typeCount)
      g.lineWidth = 0.8
      g.globalAlpha = 0.5
      g.beginPath()
      for (let i = 0; i < xs.length; i++) {
        for (let j = i + 1; j < xs.length; j++) {
          const dx = xs[j] - xs[i]
          const dy = ys[j] - ys[i]

          if (dx * dx + dy * dy >= l2) continue
          g.moveTo(xs[i], ys[i])
          g.lineTo(xs[j], ys[j])
        }
      }
      g.stroke()
      g.globalAlpha = 1
      g.fillStyle = scheme.color(t, typeCount)
      for (let i = 0; i < xs.length; i++) g.fillRect(xs[i] - 1, ys[i] - 1, 2, 2)
    },
    speedGlow: (g, args, t) =>
      intensityGlow(
        g,
        args,
        t,
        (i) => Math.hypot(args.world.vx[i], args.world.vy[i]) / SPEED_FULL
      ),
    crowdGlow: (g, args, t) =>
      intensityGlow(g, args, t, (i) => args.world.near[i] / CROWD_FULL),
    mono: (g, { world, scheme }, t) => {
      g.fillStyle = scheme.fg
      g.globalAlpha = 0.18 + 0.05 * (t % 4)
      eachOfType(world, t, size, (x, y) =>
        g.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT)
      )
      g.globalAlpha = 1
    },
  }
}

export type Renderer = { draw: (args: DrawArgs) => void }

export const createRenderer = (
  ctx: CanvasRenderingContext2D,
  size: number
): Renderer => {
  const sprites = new Map<string, HTMLCanvasElement>()
  const sprite = (color: string) => {
    const key = color
    const cached = sprites.get(key)

    if (cached) return cached
    const made = makeSprite(color)

    sprites.set(key, made)
    return made
  }
  const passes = createPasses(size, sprite)
  // 残像は画面全体を薄めると他の種類まで尾を引くので、残像の種類だけ別レイヤーに描いて薄める
  const layer = document.createElement('canvas')

  layer.width = size
  layer.height = size
  const lg = layer.getContext('2d')

  const drawTrailLayer = (args: DrawArgs) => {
    if (!lg) return
    lg.globalCompositeOperation = 'destination-out'
    lg.globalAlpha = TRAIL_FADE
    lg.fillRect(0, 0, size, size)
    lg.globalCompositeOperation = 'source-over'
    lg.globalAlpha = 1
    args.styles.forEach((s, t) => {
      if (s === 'trail' && t < args.typeCount) passes.trail(lg, args, t)
    })
    ctx.drawImage(layer, 0, 0)
  }

  return {
    draw: (args) => {
      ctx.fillStyle = args.scheme.bg
      ctx.fillRect(0, 0, size, size)
      if (args.styles.slice(0, args.typeCount).includes('trail')) {
        drawTrailLayer(args)
      } else {
        lg?.clearRect(0, 0, size, size)
      }
      for (let t = 0; t < args.typeCount; t++) {
        const style = args.styles[t] ?? 'dots'

        if (style !== 'trail') passes[style](ctx, args, t)
      }
    },
  }
}
