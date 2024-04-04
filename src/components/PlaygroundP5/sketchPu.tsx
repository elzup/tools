import P5 from 'p5'

function draw(p: P5) {
  p.background(0)
  p.translate(p.width / 2, p.height / 2)

  const circles = 100 // 円の数
  const maxRadius = 250 // 最大半径

  for (let i = 0; i < circles; i++) {
    let radius = p.map(i, 0, circles, 2, maxRadius)
    let angle = p.map(i, 0, circles, 0, 360)
    let hue = p.map(i, 0, circles, 0, 360)

    p.fill(hue, 100, 100)
    p.noStroke()
    p.push()
    p.rotate(angle)
    p.ellipse(radius, 0, radius / circles, radius / circles)
    p.pop()
  }

  p.fill(360, 100, 100)
  p.ellipse(0, 0, 20, 20)

  // テキスト表示
  p.fill(255)
  p.textSize(16)
  p.textAlign(p.CENTER, p.CENTER)
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
