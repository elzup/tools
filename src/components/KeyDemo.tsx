import React from 'react'
import { useKeyQueue } from './useKey'

const KeyDemo = () => {
  const { downQueue, upQueue, downAllQueue } = useKeyQueue()

  return (
    <div>
      <p>downQueue: {downQueue.join(',')}</p>
      <p>upQueue: {upQueue.join(',')}</p>
      <p>downAllQueue: {downAllQueue.join(',')}</p>
    </div>
  )
}

export default KeyDemo
