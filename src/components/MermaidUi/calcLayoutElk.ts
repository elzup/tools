// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { Edge, Node } from 'react-flow-renderer'
import { MmdEdge, MmdVertex } from './useMermaid'

const elkOption = {}
const elk = new ELK(elkOption)

export type Elem = Node<MmdVertex & { label: string }> | Edge
type Position = { x: number; y: number; id: string }

export async function calkLayoutElk(
  vertices: MmdVertex[],
  edges: MmdEdge[]
): Promise<Position[]> {
  if (!vertices || !edges) return []
  const { children = [] } = (await elk.layout({
    id: 'root',
    // layoutOptions: { 'elk.algorithm': 'layered' },
    children: vertices.map((v) => ({
      id: v.id,
      width: 200,
      height: 50,
    })),
    edges: edges.map((e) => ({
      id: `e${e.start}-${e.end}`,
      sources: [e.start],
      targets: [e.end],
    })),
  })) as { children: Position[] }

  return children
}
