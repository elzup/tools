import * as React from 'react'
import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { useKeyQueue } from '../components/useKey'

const title = 'React KeyEvnet hooks'
const KeyEventMaster = () => {
  const { pressQueue, changePressQueue } = useKeyQueue()

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>press: {pressQueue.join(',')}</p>
      <p>changedPress: {changePressQueue.join(',')}</p>
    </Layout>
  )
}

export default KeyEventMaster
