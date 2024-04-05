import P5 from 'p5'
import { RiNotionFill } from 'react-icons/ri'

let R = 97,
  r = 68,
  a = 16

function draw(p: P5) {
  p.background(50)
  p.noFill()
  p.translate(p.width / 2, p.height / 2)
  p.beginShape()
  for (let j = 0; j < 360; j++) {
    p.curveVertex(
      5 * ((R - r) * Math.cos((r / R) * j) + a * Math.cos((1 - r / R) * j)),
      5 * ((R - r) * Math.sin((r / R) * j) - a * Math.sin((1 - r / R) * j))
    )
  }
  p.endShape()
}

export const sketchPu = (p: P5) => {
  const size = 4
  const w = 105

  p.setup = () => {
    p.createCanvas(500, 500)
    p.stroke(255)
    p.angleMode(p.DEGREES)
  }

  p.draw = () => {
    draw(p)
  }
}
