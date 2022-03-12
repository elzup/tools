// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { keyBy } from 'lodash'
import { Edge, Node } from 'react-flow-renderer'
import { MmdEdge, Vertex } from './useMermaid'

const elkOption = {}
const elk = new ELK(elkOption)

export type Elem = Node<Vertex & { label: string }> | Edge

export async function convert(
  vertices: Vertex[],
  edges: MmdEdge[]
): Promise<Elem[]> {
  if (!vertices || !edges) return []
  const { children = [] } = (await elk.layout({
    id: 'root',
    // layoutOptions: { 'elk.algorithm': 'layered' },
    children: vertices.map((v) => ({
      id: v.id,
      width: 200,
      height: 50,
    })),
    edges: edges.map((e, i) => ({
      id: `e${e.start}-${e.end}`,
      sources: [e.start],
      targets: [e.end],
    })),
  })) as { children: { x: number; y: number; id: string }[] }
  const positionsById = keyBy(children, (e) => e.id)

  console.log(positionsById)

  return [
    ...vertices.map((node): Node<Vertex & { label: string }> => {
      const classes = [].filter(Boolean)

      return {
        id: node.id,
        // targetPosition: 'bottom',
        // sourcePosition: 'top',
        type: 'default',
        position: {
          x: positionsById[node.id].x || 0,
          y: positionsById[node.id].y || 0,
        },
        data: { ...node, label: node.text },
        className: classes.join(' '),
        style: {
          // borderWidth: 2,
        },
      }
    }),
    ...edges.map((e, i): Edge => {
      const arrowType = e.type === 'arrow_point' ? 'arrowclosed' : 'arrowopen'

      return {
        id: `e${e.start}-${e.end}-${i}`,
        source: e.start,
        target: e.end,
        // targetPosition: 'bottom',
        // sourcePosition: 'top',
        type: arrowType,
        // arrowHeadType: arrowType,
        style: {
          // borderWidth: 2,
        },
        animated: true,
      }
    }),
  ]
}
