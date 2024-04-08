import p5 from 'p5'
import { colorScheme } from './colorScheme'

export const shuffleSchema = (p: p5) =>
  p
    .shuffle(p.random(colorScheme).colors)
    .concat()
    .map((v) => p.color(v))
