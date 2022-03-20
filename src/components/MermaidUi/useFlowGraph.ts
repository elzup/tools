import { useEffect, useState } from 'react'
import { calkLayoutElk } from './calcLayoutElk'
import { toFlowElem } from './toFlowElem'
import { Graph } from './types'
import { parseMarmaid } from './useMermaid'

export const useFlowGraph = (
  mmd: string,
  nodeSize: { h: number; w: number } = { h: 100, w: 200 },
  dire: 'TD' | 'LR' = 'TD'
) => {
  const [graph, setGraph] = useState<Graph>({
    vertices: [],
    edges: [],
    flows: { nodes: [], edges: [] },
  })

  useEffect(() => {
    const lines = mmd.split('\n')
    const text = lines.join('\n')
    const { vertices, edges } = parseMarmaid(text)

    ;(async () => {
      const positions = await calkLayoutElk(vertices, edges, nodeSize, dire)
      const flows = toFlowElem(vertices, edges, positions, dire)

      setGraph({ vertices, edges, flows })
    })()
  }, [mmd])
  return graph
}
