import React from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'react-flow-renderer'
import styled from 'styled-components'
import { MmdGroup } from './MermaidUi/types'
import { useFlowGraph } from './MermaidUi/useFlowGraph'

type Props = {
  mmd: MmdGroup
  height?: string
  zoom?: number
  nodeSize?: { h: number; w: number }
  dire?: 'LR' | 'TD'
  hideMap?: boolean
  hideCtl?: boolean
}
function MmdGraph({
  mmd,
  height = '90vh',
  zoom = 0.5,
  nodeSize = { h: 100, w: 200 },
  dire = 'TD',
  hideMap = false,
  hideCtl = false,
}: Props) {
  const { flows } = useFlowGraph(mmd, nodeSize, dire)

  if (flows.nodes.length === 0) return null

  return (
    <Frame style={{ height }}>
      <ReactFlowProvider>
        <ReactFlow
          id={mmd.text.split('')[1]}
          style={{ background: 'white' }}
          defaultNodes={flows.nodes}
          fitView
          defaultEdges={flows.edges}
          minZoom={0.04}
          defaultZoom={zoom}
          preventScrolling={false}
          // onLoad={setRfInstance}
          panOnScroll={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          {!hideCtl && <Controls defaultChecked />}
          <Background />
          {!hideMap && <MiniMap />}
        </ReactFlow>
      </ReactFlowProvider>
    </Frame>
  )
}

const Frame = styled.div`
  width: 100%;
  border: solid 1px #ccc;
`

export default MmdGraph
