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
      <MermaidUiStatic />
    </Layout>
  )
}

export default MermaidUi
