// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { MmdEdge, MmdVertex, Position } from './types'

const elkOption = {}
const elk = new ELK(elkOption)

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
      height: 100,
    })),
    edges: edges.map((e) => ({
      id: `e${e.start}-${e.end}`,
      sources: [e.start],
      targets: [e.end],
    })),
  })) as { children: Position[] }

  return children
}
