import React from 'react'

const storyMmd = `
%%%subgraph グラフの見方;
A[原因]-->|備考|B[結果]
C[原因] -.->D[偶発]
E[原因]  -.- o F[心理的影響]
G[原因]  x-.- x H[対比,オマージュ]
%%%end;  
`

function StoryMmdGraph() {
  return <MmdGraph mmd={storyMmd} height={'300px'} />
}

export default StoryMmdGraph
