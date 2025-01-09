import P5 from 'p5'

type State = {
  f: number
}
function draw(p: P5, _state: State) {
  p.background(255)

  for (let i = 0; i < 24; i++) {
    drawPlanckDistribution(p, i * 200)
  }
  drawLinewave(p)
}

function drawPlanckDistribution(p: P5, T: number) {
  let h = 6.62607004e-34 // プランク定数
  let c = 3.0e8 // 光速
  let k = 1.38064852e-23 // ボルツマン定数

  // #8FBDD4
  //
  p.stroke(143, 189, 212)
  p.noFill()
  p.beginShape()
  for (let lambda = 1e-7; lambda < 3e-6; lambda += 1e-9) {
    let B =
      (2 * h * c * c) /
      (p.pow(lambda, 5) * (p.exp((h * c) / (lambda * k * T)) - 1))
    let x = p.map(lambda, 1e-7, 3e-6, 0, p.width)
    let y = p.map(B, 0, 1e13, p.height, 0)

    p.vertex(x, y)
  }
  p.endShape()
}

function drawLinewave(p: P5) {
  const f = 0

  p.strokeWeight(2)
  for (let x = -200 - ((f * 3) % 200); x < 600; x += 200) {
    if (x <= 399) continue
    for (let y = -50 - x / 7; y < 600; y += 6) {
      const t = (300 * p.noise(x + f * 3, y + x / 7 - f / 99)) / 3

      p.stroke(54, 107, 141, t * 3)
      p.line(x - t / 2, y, x + t / 2, y)
    }
  }
}

export const sketchPu = (p: P5) => {
  const _size = 4

  p.setup = () => {
    p.createCanvas(720, 720)
    p.noStroke()
  }

  let state: State = {
    f: 0,
  }

  p.draw = () => {
    draw(p, state)
  }
}
