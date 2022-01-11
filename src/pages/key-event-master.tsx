import dynamic from 'next/dynamic'
import React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const DynamicKeyDemo = dynamic(() => import('../components/KeyDemo'), {
  ssr: false,
})

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <DynamicKeyDemo />
    </Layout>
  )
}

export default KeyEventMaster
