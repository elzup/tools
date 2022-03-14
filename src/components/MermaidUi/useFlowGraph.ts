import { useState } from 'react'
import { useAsync } from 'react-use'
import { calkLayoutElk } from './calcLayoutElk'
import { toFlowElem } from './toFlowElem'
import { Graph } from './types'
import { parseMarmaid } from './useMermaid'

export const useFlowGraph = (mmd: string) => {
  const [graph, setGraph] = useState<Graph>({
    vertices: [],
    edges: [],
    flows: [],
  })

  useAsync(async () => {
    const lines = mmd.split('\n')
    const text = lines.join('\n')
    const { vertices, edges } = parseMarmaid(text)
    const positions = await calkLayoutElk(vertices, edges)

    console.log(lines[1])

    const flows = toFlowElem(vertices, edges, positions)

    setGraph({ vertices, edges, flows })
  }, [mmd])
  return graph
}
