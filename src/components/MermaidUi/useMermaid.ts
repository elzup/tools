import mermaid from 'mermaid'
// eslint-disable-next-line import/no-unresolved
import mermaidAPI from 'mermaid/mermaidAPI'
import { useEffect, useState } from 'react'
import { convert, Elem } from './convertMermaidToFlow'

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

export type Vertex = {
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

export const useMmdGraph = (mmd: string) => {
  const [graph, setGraph] = useState<{
    vertices: Vertex[]
    edges: MmdEdge[]
    flows: Elem[]
  }>({ vertices: [], edges: [], flows: [] })

  useEffect(() => {
    const {
      parser: { yy },
    } = mermaid.mermaidAPI.parse(mmd)

    console.log(yy)

    const vertices = Object.values(yy.getVertices() as Record<string, Vertex>)
    const edges = yy.getEdges() as MmdEdge[]

    convert(vertices, edges).then((flows) => {
      setGraph({ vertices, edges, flows })
    })
  }, [mmd])
  return graph
}
