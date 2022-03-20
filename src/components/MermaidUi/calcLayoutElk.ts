// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { MmdEdge, MmdVertex, Position } from './types'

const elkOption = {}
const elk = new ELK(elkOption)

export async function calkLayoutElk(
  vertices: MmdVertex[],
  edges: MmdEdge[],
  nodeSize: { h: number; w: number } = { h: 100, w: 100 },
  dire = 'TD'
): Promise<Position[]> {
  if (!vertices || !edges) return []
  const { children = [] } = (await elk.layout({
    id: 'root',
    layoutOptions: {
      'org.eclipse.elk.direction': { TD: 'DOWN', LR: 'RIGHT' }[dire] || 'DOWN',
    },
    children: vertices.map((v) => ({
      id: v.id,
      width: nodeSize.w,
      height: nodeSize.h,
    })),
    edges: edges.map((e) => ({
      id: `e${e.start}-${e.end}`,
      sources: [e.start],
      targets: [e.end],
    })),
  })) as { children: Position[] }

  return children
}
