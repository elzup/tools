import { Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import Link from 'next/link'
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
        <Link href="https://github.com/mermaid-js/mermaid">mermaid</Link>→
        <Link href="https://github.com/kieler/elkjs">elkjs</Link>→
        <Link href="https://github.com/wbkd/react-flow">React Flow</Link>
        {')'}
      </Typography>
      <MermaidUiStatic />
    </Layout>
  )
}

export default MermaidUi
