import { generateTextDiagramTransformer } from './binaryPacketDiagramTransformer'

import { TransformResult, Transformer } from './transformer'

export type TextTransformer = {
  name: string
  transform: Transformer
}

export const applyTransformers = (
  input: string,
  transformerName: string
): TransformResult | string => {
  const transformer: TextTransformer | undefined = undefined

  return 'Transformer not found'
}
