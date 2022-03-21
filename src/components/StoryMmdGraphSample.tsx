import React from 'react'
import MmdGraph from './MmdGraph'

const storyMmd = `
%%%subgraph グラフの見方;
flowchart LR;
A[原因]-->|補足|B[結果]
C[原因] -.-> D[偶発]
E[原因] -.-o F[心理的影響]
G[原因] x-.-x H[対比,オマージュ]
%%%end;
`

function StoryMmdGraph() {
  return (
    <div style={{ width: '500px' }}>
      <MmdGraph
        mmd={storyMmd}
        height={'280px'}
        zoom={1}
        nodeSize={{ w: 200, h: 40 }}
        hideMap
        hideCtl
        dire={'LR'}
      />
    </div>
  )
}

export default StoryMmdGraph
