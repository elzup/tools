// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { MmdEdge, MmdVertex, Position } from './types'

const elkOption = {}
const elk = new ELK(elkOption)

export async function calkLayoutElk(
  vertices: MmdVertex[],
  edges: MmdEdge[],
  { w: width, h: height }: { h: number; w: number } = { h: 100, w: 100 },
  dire = 'TD'
): Promise<Position[]> {
  if (!vertices || !edges) return []
  const toNode = (v: MmdVertex) => ({ id: v.id, width, height })
  const outsides = vertices.filter((v) => v.outside)
  const insides = vertices.filter((v) => !v.outside)
  const elkChildren = [
    ...outsides.map(toNode),
    { id: 'current-root', children: insides.map(toNode) },
  ]
  const elkEdges = edges.map((e) => ({
    id: `e${e.start}-${e.end}`,
    sources: [e.start],
    targets: [e.end],
  }))

  console.log({ children: elkChildren, edges: elkEdges })
  const { children = [] } = (await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      hierarchyHandling: 'INCLUDE_CHILDREN',
      'org.eclipse.elk.direction': { TD: 'DOWN', LR: 'RIGHT' }[dire] || 'DOWN',
    },
    children: elkChildren,
    edges: elkEdges,
  })) as { children: Position[] }

  console.log(children)

  return children
}
