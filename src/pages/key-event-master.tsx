import React from 'react'
import { Header } from 'semantic-ui-react'

import dynamic from 'next/dynamic'
import Layout from '../components/Layout'

const DynamicKeyDemo = dynamic(() => import('../components/KeyDemo'), {
  ssr: false,
})

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <DynamicKeyDemo />
    </Layout>
  )
}

export default KeyEventMaster
