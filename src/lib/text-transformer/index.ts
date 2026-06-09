import type { Transformer } from './transformer'

export type TextTransformer = {
  name: string
  transform: Transformer
}
