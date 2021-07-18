import dynamic from 'next/dynamic'
import React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const SubWindowParts = dynamic(() => import('../components/SubWindowParts'), {
  ssr: false,
})

const title = 'sub Window experiment'
const SubWindowEx = () => {
  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <SubWindowParts />
    </Layout>
  )
}

export default SubWindowEx
