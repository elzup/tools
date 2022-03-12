import { keyBy } from 'lodash'
import { MmdEdge, MmdVertex } from './useMermaid'

export function toFlowElem(vertices: MmdVertex[], edges: MmdEdge[]) {
  const positionsById = keyBy(children, (e) => e.id)

  console.log(positionsById)

  return [
    ...vertices.map((node): Node<MmdVertex & { label: string }> => {
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
