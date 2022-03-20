import { keyBy } from 'lodash'
import { Edge, Node, Position as RfPosition } from 'react-flow-renderer'
import { MmdEdge, MmdVertex, Position } from './types'

export function toFlowElem(
  vertices: MmdVertex[],
  edges: MmdEdge[],
  positions: Position[],
  dire: 'TD' | 'LR' = 'TD'
) {
  const positionsById = keyBy(positions, (e) => e.id)
  const [targetPosition, sourcePosition] = {
    TD: [RfPosition.Top, RfPosition.Bottom],
    LR: [RfPosition.Left, RfPosition.Right],
  }[dire]

  const nodeElems = vertices.map(
    (node): Node<MmdVertex & { label: string }> => {
      const classes = [].filter(Boolean)

      return {
        id: node.id,
        targetPosition,
        sourcePosition,
        type: 'default',
        position: {
          x: positionsById[node.id].x || 0,
          y: positionsById[node.id].y || 0,
        },
        data: { ...node, label: node.text },
        className: classes.join(' '),
        style: {
          borderWidth: 2,
        },
      }
    }
  )
  const edgeElems = edges.map((e, i): Edge => {
    const arrowType = e.type === 'arrow_point' ? 'arrowclosed' : 'arrow'

    return {
      id: `e${e.start}-${e.end}-${i}`,
      source: e.start,
      target: e.end,
      markerEnd: arrowType,
      // type: 's'
      style: { stroke: 'black', strokeWidth: 2 },
    }
  })

  return { nodes: nodeElems, edges: edgeElems }
}
