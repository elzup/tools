import { Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const MermaidUiStatic = dynamic(() => import('../components/MermaidUi'), {
  ssr: false,
})

const title = 'mermaid react ui experiments'
const MermaidUi = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Typography>
        mermaid graph to React-flow convert.{'('}
        <a href="https://github.com/mermaid-js/mermaid">mermaid</a>→
        <a href="https://github.com/kieler/elkjs">elkjs</a>→
        <a href="https://github.com/wbkd/react-flow">React Flow</a>
        {')'}
      </Typography>
      <MermaidUiStatic />
    </Layout>
  )
}

export default MermaidUi
