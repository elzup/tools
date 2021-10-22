import React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { useKeyQueue } from '../components/useKey'

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  const { downQueue, upQueue } = useKeyQueue()

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>press: {downQueue.join(',')}</p>
      <p>changedPress: {upQueue.join(',')}</p>
    </Layout>
  )
}

export default KeyEventMaster
