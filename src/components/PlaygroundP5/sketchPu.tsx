import P5 from 'p5'

function draw(p: P5) {
  p.background(0)
  const centerX = p.width / 2
  const centerY = p.height / 2
  const maxRadius = p.min(p.width, p.height) * 0.4
  const numCircles = 100
  const circleGap = maxRadius / numCircles

  // 中央の大きな円（プランク質量を象徴）
  p.fill(60, 100, 100)
  p.ellipse(centerX, centerY, 2 * circleGap, 2 * circleGap)

  // 小さな円を放射状に配置
  for (let i = 0; i < numCircles; i++) {
    let radius = (i + 1) * circleGap
    let hue = p.map(i, 0, numCircles, 0, 360)

    p.fill(hue, 100, 100)
    for (let angle = 0; angle < 360; angle += 360 / numCircles) {
      let x = centerX + p.cos(p.radians(angle)) * radius
      let y = centerY + p.sin(p.radians(angle)) * radius

      p.ellipse(x, y, circleGap, circleGap)
    }
  }
}

export const sketchPu = (p: P5) => {
  const size = 4
  const w = 105

  p.setup = () => {
    p.createCanvas(w * size, w * size)
    p.background('orange')
    p.noLoop()
    p.stroke('blue')
    p.fill('red')
  }

  p.draw = () => {
    draw(p)
  }
}
