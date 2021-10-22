import React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { useKeyQueue } from '../components/useKey'

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  const { downQueue, upQueue, downAllQueue } = useKeyQueue()

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>downQueue: {downQueue.join(',')}</p>
      <p>upQueue: {upQueue.join(',')}</p>
      <p>downAllQueue: {downAllQueue.join(',')}</p>
    </Layout>
  )
}

export default KeyEventMaster
