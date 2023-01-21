import mermaid from 'mermaid'
// eslint-disable-next-line import/no-unresolved
import { MmdEdge, MmdGroup, MmdVertexRaw } from './types'

// type MermaidConfig = typeof mermaid.mermaidAPI.defaultConfig
// export const useMermaid = (
//   id: string,
//   content: string,
//   config: MermaidConfig = {}
// ) => {
//   const [svg, setSvg] = useState<string>()
//   mermaid.mermaidAPI.initialize(config)
//   useEffect(() => {
//     mermaid.mermaidAPI.render(id, content, (svgCode) => setSvg(svgCode))
//   }, [id, content, config])
//   return svg
// }

export const parseMarmaid = (text: string): MmdGroup => {
  mermaid.mermaidAPI.initialize({ flowchart: { htmlLabels: false } })
  console.log(mermaid.mermaidAPI.parse)
  const result = mermaid.mermaidAPI.parse(text)

  const { yy } = result.parser

  console.log({ yy })

  const vertices = Object.values(
    yy.getVertices() as Record<string, MmdVertexRaw>
  ).map((v) => ({ ...v, outside: v.id === v.text }))
  const edges = yy.getEdges() as MmdEdge[]

  return { vertices, edges, text }
}
