import mermaid from 'mermaid'
// eslint-disable-next-line import/no-unresolved
import mermaidAPI from 'mermaid/mermaidAPI'
import { useEffect, useState } from 'react'

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

export type MmdVertex = {
  id: string
  text: string
  type: string
}
export type MmdEdge = {
  start: string
  end: string
  stroke: 'normal' | 'thick' | 'dotted'
  type: 'arrow_point' | 'arrow_open'
  text: string
}

export const parseMarmaid = (mmd: string) => {
  const {
    parser: { yy },
  } = mermaid.mermaidAPI.parse(mmd)

  console.log(yy)

  const vertices = Object.values(yy.getVertices() as Record<string, MmdVertex>)
  const edges = yy.getEdges() as MmdEdge[]

  return { vertices, edges }
}
