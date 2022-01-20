import dynamic from 'next/dynamic'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const PikblMemo = dynamic(() => import('../components/PikblMemo'), {
  ssr: false,
})

const title = 'デコピクミンMEMO'
const PikblMemoPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <PikblMemo />
    </Layout>
  )
}

export default PikblMemoPage
