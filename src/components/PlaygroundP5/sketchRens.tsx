/* eslint-disable no-param-reassign */
// fork by: https://openprocessing.org/sketch/1992772
import P5 from 'p5'
import { range } from '@elzup/kit/lib/range'
import { shuffleSchema } from './p5Util'

export const sketchRens = (p: P5) => {
  let globalN = 0
  let aOfs = ((p.TWO_PI / 360) * 1) / 2
  let rOfs = 1
  const palette = shuffleSchema(p)

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.noStroke()
    p.frameRate(20)
  }

  p.draw = () => {
    p.background(0)
    p.randomSeed(0)

    p.push()
    p.translate(p.width / 2, p.height / 2)
    // rotate(noise(frameCount / 100) * TWO_PI);

    const num = 5

    const arr2 = range(num).map((i) => {
      let n = p.sin((i / num) * p.TWO_PI + p.frameCount / 120) / 2 + 1 / 2

      return easeInOutCirc(n)
    })

    const aSum = arr2.reduce((a, b) => a + b, 0)
    const arr = arr2.map((n) => n / aSum)

    let x = 0
    let y = 0
    let a1 = 0
    let a2 = p.TWO_PI
    let r2 = (p.max(p.width, p.height) / 2) * p.sqrt(2)
    let r1 = r2 / 20
    let rStep = r2 - r1
    let depth = 4

    let sum = 0

    p.noStroke()
    for (let i = 0; i < arr.length; i++) {
      p.push()
      p.rotate((i / arr.length) * p.TWO_PI)
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
      p.pop()
    }
    p.pop()
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
    p.push()
    p.translate(x, y)
    p.rotate(p.noise(x, y, p.frameCount / 150000) * p.TWO_PI)
    let rsx = p.random(100)
    let rsy = p.random(100)
    let t = p.noise(rsx, rsy, p.frameCount / 5000) //frameCount/500%1;

    t = easeInOutElastic(t) * p.TWO_PI
    let na =
      a1 +
      (p.sin(
        rsx +
          y / 20 +
          ((t * p.TWO_PI) / 4) * depth +
          (p.radians(p.frameCount / 5) % p.TWO_PI)
      ) /
        2 +
        0.5) *
        (a2 - a1)
    let nr =
      r1 +
      (p.cos(
        rsy +
          x / 20 +
          ((t * p.TWO_PI) / 4) * depth +
          (p.radians(p.frameCount / 5) % p.TWO_PI)
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
    p.pop()
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
      endAngle - startAngle < p.radians(1) ||
      minD < 0 ||
      p.abs(maxD - minD) < 5
    )
      return

    p.push()
    p.translate(x, y)
    let d = maxD - minD
    let e = minD + d / 2
    let c1 = palette[globalN % palette.length]
    let c2 = palette[(globalN + 1) % palette.length]

    p.noFill()
    p.strokeCap(p.SQUARE)
    let angleStep = p.TWO_PI / 360

    if (globalN % 2 === 0) {
      for (let a = startAngle; a <= endAngle; a += angleStep * (depth + 3)) {
        let c = p.lerpColor(c1, c2, p.map(a, startAngle, endAngle, 0, 1))

        p.stroke(c)
        p.strokeWeight(d)
        p.beginShape()
        p.vertex(p.cos(a) * e, p.sin(a) * e)
        p.vertex(p.cos(a + angleStep) * e, p.sin(a + angleStep) * e)
        p.endShape()
      }
    } else {
      let d2 = d / 10

      p.strokeWeight(d2)
      for (
        let f = p.max(maxD, minD) - d2 / 2;
        f > p.min(maxD, minD) + d2 / 2;
        f -= d2 * 2
      ) {
        let c = p.lerpColor(
          c1,
          c2,
          p.map(f, p.min(maxD, minD), p.max(maxD, minD), 0, 1)
        )

        p.stroke(c)
        p.arc(0, 0, f * 2, f * 2, startAngle, endAngle)
      }
    }
    p.pop()
  }

  function getColorByTheta(theta: number, time: number) {
    let th = 8.0 * theta + time * 5.0
    let r = 0.5 + 0.5 * p.sin(th)

    const g = 0.5 + 0.5 * p.sin(th - p.PI / 3)
    const b = 0.5 + 0.5 * p.sin(th - (p.PI * 2) / 3)

    return p.color(r * 255, g * 255, b * 255)
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
