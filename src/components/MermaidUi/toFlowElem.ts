import { keyBy } from 'lodash'
import { Edge, Node, Position as RfPosition } from 'react-flow-renderer'
import { MmdEdge, MmdVertex, Position } from './types'

export function toFlowElem(
  vertices: MmdVertex[],
  edges: MmdEdge[],
  positions: Position[]
) {
  const positionsById = keyBy(positions, (e) => e.id)

  console.log(positionsById)

  const nodeElems = vertices.map(
    (node): Node<MmdVertex & { label: string }> => {
      const classes = [].filter(Boolean)

      return {
        id: node.id,
        targetPosition: RfPosition.Top,
        sourcePosition: RfPosition.Bottom,
        type: 'default',
        position: {
          x: positionsById[node.id].x || 0,
          y: positionsById[node.id].y || 0,
        },
        data: { ...node, label: node.text },
        className: classes.join(' '),
        draggable: false,
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
      type: arrowType,
      // @ts-ignore
      arrowHeadType: arrowType,
      style: {
        // borderWidth: 2,
      },
      animated: true,
    }
  })

  return [...nodeElems, ...edgeElems]
}
