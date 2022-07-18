import { keyBy } from 'lodash'
import {
  Edge,
  MarkerType,
  Node,
  Position as RfPosition,
} from 'react-flow-renderer'
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
      const classes = [node.outside ? 'outside' : 'inside'].filter(Boolean)

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
    // console.log(e)

    const options = {
      id: `e${e.start}-${e.end}-${i}`,
      source: e.start,
      target: e.end,
      // type: 's'
      style: { stroke: 'black', strokeWidth: 2 },
    } as Edge

    if (e.stroke !== 'normal') {
      options.style = {
        ...options.style,
        strokeDasharray: '10',
        stroke: 'gray',
      }
    }
    if (e.type === 'arrow_point') {
      options.markerEnd = { type: MarkerType.ArrowClosed, color: 'black' }
      options.style = { ...options.style, stroke: 'black' }
    } else if (e.type === 'arrow_circle') {
      options.markerEnd = { type: MarkerType.ArrowClosed, color: 'green' }
      options.style = {
        ...options.style,
        strokeDasharray: '10',
        stroke: 'green',
      }
    } else if (e.type === 'double_arrow_cross') {
      options.style = { ...options.style, strokeDasharray: '5' }
    }

    if (e.text) options.label = e.text

    return options
  })

  return { nodes: nodeElems, edges: edgeElems }
}
