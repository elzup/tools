import P5 from 'p5'

export const sketch = (p: P5) => {
  const w = 400

  p.setup = () => {
    p.createCanvas(w, w)
    p.background(100)
    range(w ** 2)
    for (;;) {}
  }

  p.draw = () => {
    p.ellipse(p.width / 2, p.height / 2, 50, 50)
  }
}
