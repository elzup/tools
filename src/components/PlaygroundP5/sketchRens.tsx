/* eslint-disable no-param-reassign */
// fork by: https://openprocessing.org/sketch/1992772
import P5 from 'p5'
import { range } from '@elzup/kit/lib/range'
import { binds, shuffleSchema } from './p5Util'

export const sketchRens = (p: P5) => {
  let globalN = 0
  let aOfs = ((p.TWO_PI / 360) * 1) / 2
  let rOfs = 1
  const palette = shuffleSchema(p)
  //
  const b = binds(p)
  const { background, push, pop } = b
  const { beginShape, endShape, vertex, map } = b
  const { noStroke, noFill, stroke, strokeWeight, strokeCap } = b
  const { lerpColor, color } = b

  const { translate, rotate } = b
  const { sin, cos, sqrt, max, min, radians, abs, arc } = b
  const { random, randomSeed, noise } = b
  const { TWO_PI, PI, SQUARE } = p

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.noStroke()
    p.frameRate(20)
  }

  p.draw = () => {
    background(0)
    randomSeed(0)
    const { width, height, frameCount } = p

    push()
    translate(width / 2, height / 2)
    // rotate(noise(frameCount / 100) * TWO_PI);

    const num = 5

    const arr2 = range(num).map((i) => {
      let n = sin((i / num) * TWO_PI + frameCount / 120) / 2 + 1 / 2

      return easeInOutCirc(n)
    })

    const aSum = arr2.reduce((a, b) => a + b, 0)
    const arr = arr2.map((n) => n / aSum)

    let x = 0
    let y = 0
    let a1 = 0
    let a2 = TWO_PI
    let r2 = (max(width, height) / 2) * sqrt(2)
    let r1 = r2 / 20
    let rStep = r2 - r1
    let depth = 4

    let sum = 0

    noStroke()
    for (let i = 0; i < arr.length; i++) {
      push()
      rotate((i / arr.length) * TWO_PI)
      recursiveArc(
        x,
        y,
        a1,
        a2,
        r1 + sum * rStep,
        r1 + rStep * (sum + arr[i]),
        depth
      )
      sum += arr[i]
      pop()
    }
    pop()
  }

  function recursiveArc(
    x: number,
    y: number,
    a1: number,
    a2: number,
    r1: number,
    r2: number,
    depth: number
  ) {
    if (depth < 0) return
    if (a1 > a2) {
      let tmp = a1

      a1 = a2
      a2 = tmp
    }
    if (r1 > r2) {
      let tmp = r1

      r1 = r2
      r2 = tmp
    }
    push()
    translate(x, y)
    rotate(noise(x, y, p.frameCount / 150000) * TWO_PI)
    let rsx = random(100)
    let rsy = random(100)
    let t = noise(rsx, rsy, p.frameCount / 5000) //frameCount/500%1;

    t = easeInOutElastic(t) * TWO_PI
    let na =
      a1 +
      (sin(
        rsx +
          y / 20 +
          ((t * TWO_PI) / 4) * depth +
          (radians(p.frameCount / 5) % TWO_PI)
      ) /
        2 +
        0.5) *
        (a2 - a1)
    let nr =
      r1 +
      (cos(
        rsy +
          x / 20 +
          ((t * TWO_PI) / 4) * depth +
          (radians(p.frameCount / 5) % TWO_PI)
      ) /
        2 +
        0.5) *
        (r2 - r1)

    if (depth === 0) {
      drawArc(x, y, a1 + aOfs, na - aOfs, r1 + rOfs, nr - rOfs, depth)
      drawArc(x, y, na + aOfs, a2 - aOfs, r1 + rOfs, nr - rOfs, depth)
      drawArc(x, y, a1 + aOfs, na - aOfs, nr + rOfs, r2 - rOfs, depth)
      drawArc(x, y, na + aOfs, a2 - aOfs, nr + rOfs, r2 - rOfs, depth)
    } else {
      recursiveArc(x, y, a1, na, r1, nr, depth - 1)
      recursiveArc(x, y, na, a2, r1, nr, depth - 1)
      recursiveArc(x, y, a1, na, nr, r2, depth - 1)
      recursiveArc(x, y, na, a2, nr, r2, depth - 1)
    }
    pop()
  }

  function drawArc(
    x: number,
    y: number,
    startAngle: number,
    endAngle: number,
    minD: number,
    maxD: number,
    depth: number
  ) {
    globalN++
    if (
      startAngle < 0 ||
      endAngle - startAngle < radians(1) ||
      minD < 0 ||
      abs(maxD - minD) < 5
    )
      return

    push()
    translate(x, y)
    let d = maxD - minD
    let e = minD + d / 2
    let c1 = palette[globalN % palette.length]
    let c2 = palette[(globalN + 1) % palette.length]

    noFill()
    strokeCap(SQUARE)
    let angleStep = TWO_PI / 360

    if (globalN % 2 === 0) {
      for (let a = startAngle; a <= endAngle; a += angleStep * (depth + 3)) {
        let c = lerpColor(c1, c2, map(a, startAngle, endAngle, 0, 1))

        stroke(c)
        strokeWeight(d)
        beginShape()
        vertex(cos(a) * e, sin(a) * e)
        vertex(cos(a + angleStep) * e, sin(a + angleStep) * e)
        endShape()
      }
    } else {
      let d2 = d / 10

      strokeWeight(d2)
      for (
        let f = max(maxD, minD) - d2 / 2;
        f > min(maxD, minD) + d2 / 2;
        f -= d2 * 2
      ) {
        let c = lerpColor(
          c1,
          c2,
          map(f, min(maxD, minD), max(maxD, minD), 0, 1)
        )

        stroke(c)
        arc(0, 0, f * 2, f * 2, startAngle, endAngle)
      }
    }
    pop()
  }

  function getColorByTheta(theta: number, time: number) {
    let th = 8.0 * theta + time * 5.0
    let r = 0.5 + 0.5 * sin(th)

    const g = 0.5 + 0.5 * sin(th - PI / 3)
    const b = 0.5 + 0.5 * sin(th - (PI * 2) / 3)

    return color(r * 255, g * 255, b * 255)
  }
  function easeInOutCirc(x: number) {
    return x < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
  }

  function easeInOutElastic(x: number) {
    const c5 = (2 * Math.PI) / 4.5

    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }
}
