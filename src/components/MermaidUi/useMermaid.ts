import mermaid from 'mermaid'
// eslint-disable-next-line import/no-unresolved
import mermaidAPI from 'mermaid/mermaidAPI'
import { useEffect, useState } from 'react'
import { MmdEdge, MmdGroup, MmdVertex } from './types'

export const useMermaid = (
  id: string,
  content: string,
  config: mermaidAPI.Config = {}
) => {
  const [svg, setSvg] = useState<string>()

  mermaid.mermaidAPI.initialize(config)

  useEffect(() => {
    mermaid.mermaidAPI.render(id, content, (svgCode) => setSvg(svgCode))
  }, [id, content, config])

  return svg
}

export const parseMarmaid = (text: string): MmdGroup => {
  const {
    parser: { yy },
  } = mermaid.mermaidAPI.parse(text)

  const vertices = Object.values(yy.getVertices() as Record<string, MmdVertex>)
  const edges = yy.getEdges() as MmdEdge[]

  return { vertices, edges, text }
}
