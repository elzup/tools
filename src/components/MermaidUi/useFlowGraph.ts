import { useEffect, useState } from 'react'
import { calkLayoutElk } from './calcLayoutElk'
import { toFlowElem } from './toFlowElem'
import { Graph, MmdGroup } from './types'

export const useFlowGraph = (
  mmd: MmdGroup,
  nodeSize: { h: number; w: number } = { h: 100, w: 200 },
  dire: 'TD' | 'LR' = 'TD'
) => {
  const [graph, setGraph] = useState<Graph>({
    vertices: [],
    edges: [],
    flows: { nodes: [], edges: [] },
  })

  useEffect(() => {
    const { vertices, edges } = mmd

    ;(async () => {
      const positions = await calkLayoutElk(vertices, edges, nodeSize, dire)
      const flows = toFlowElem(vertices, edges, positions, dire)

      setGraph({ vertices: vertices, edges, flows })
    })()
  }, [mmd])
  return graph
}
