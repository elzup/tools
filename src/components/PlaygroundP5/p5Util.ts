import P5 from 'p5'
import { colorScheme } from './colorScheme'

export const shuffleSchema = (p: P5) =>
  p
    .shuffle(p.random(colorScheme).colors)
    .concat()
    .map((v) => p.color(v))

export const binds = (p: P5) => {
  return {
    createCanvas: p.createCanvas.bind(p),
    background: p.background.bind(p),
    frameRate: p.frameRate.bind(p),
    push: p.push.bind(p),
    pop: p.pop.bind(p),
    map: p.map.bind(p),
    endShape: p.endShape.bind(p),
    beginShape: p.beginShape.bind(p),
    vertex: p.vertex.bind(p),

    noStroke: p.noStroke.bind(p),
    noFill: p.noFill.bind(p),
    stroke: p.stroke.bind(p),
    strokeWeight: p.strokeWeight.bind(p),
    strokeCap: p.strokeCap.bind(p),
    lerpColor: p.lerpColor.bind(p),
    color: p.color.bind(p),

    translate: p.translate.bind(p),
    rotate: p.rotate.bind(p),

    sin: p.sin.bind(p),
    cos: p.cos.bind(p),
    radians: p.radians.bind(p),
    sqrt: p.sqrt.bind(p),
    max: p.max.bind(p),
    min: p.min.bind(p),
    abs: p.abs.bind(p),
    arc: p.arc.bind(p),

    random: p.random.bind(p),
    randomSeed: p.randomSeed.bind(p),
    noise: p.noise.bind(p),
  }
}
