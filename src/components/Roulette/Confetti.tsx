import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  hue: number
  life: number
}

const GRAVITY = 0.28
const DRAG = 0.992
const BURST_COUNT = 220

const createBurst = (width: number, height: number): Particle[] =>
  Array.from({ length: BURST_COUNT }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2
    const speed = 8 + Math.random() * 18

    return {
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: height * 0.62,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 12,
      hue: Math.random() * 360,
      life: 1,
    }
  })

type Props = { trigger: number }

/** 当選のたびに紙吹雪を打ち上げる全画面キャンバス (pointer-events は無効) */
const Confetti = ({ trigger }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || trigger === 0) return
    particlesRef.current = [
      ...particlesRef.current,
      ...createBurst(canvas.clientWidth, canvas.clientHeight),
    ]
  }, [trigger])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) return
    let raf = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1

      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      ctx.clearRect(0, 0, width, height)
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vx: p.vx * DRAG,
          vy: p.vy * DRAG + GRAVITY,
          rot: p.rot + p.vr,
          life: p.life - 0.006,
        }))
        .filter((p) => p.life > 0 && p.y < height + 40)

      particlesRef.current.forEach((p) => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.globalAlpha = Math.min(1, p.life * 1.6)
        ctx.fillStyle = `hsl(${p.hue} 100% 62%)`
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  )
}

export default Confetti
