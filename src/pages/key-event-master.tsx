import React, { useState } from 'react'
import { Header } from 'semantic-ui-react'
import { useKeyPressEvent } from 'react-use'
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
      <Demo />
    </Layout>
  )
}

const Demo = () => {
  const [count, setCount] = useState(0)

  const increment = () => setCount((count) => count + 1)
  const decrement = () => setCount((count) => count - 1)
  const reset = () => setCount(() => 0)

  useKeyPressEvent(
    () => true,
    (e) => {
      console.log(e.key)
      console.log('pressed')
    },
    increment
  )
  useKeyPressEvent('x', decrement, decrement)
  useKeyPressEvent('r', reset)

  return (
    <div>
      <p>
        Try pressing <code>[</code>, <code>]</code>, and <code>r</code> to see
        the count incremented and decremented.
      </p>
      <p>Count: {count}</p>
    </div>
  )
}

export default KeyEventMaster
