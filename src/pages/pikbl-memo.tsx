import * as React from 'react'
import Layout from '../components/Layout'
import PikblMemo from '../components/PikblMemo'
import { Title } from '../components/Title'

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
