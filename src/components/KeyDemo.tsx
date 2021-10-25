import React, { useState } from 'react'
import { useKeyQueue, useRefKey } from './useKey'

const KeyDemo = () => {
  const { downQueue, upQueue, downAllQueue } = useKeyQueue()
  const [press, setPress] = useState<string>('leaved')
  const ref = useRefKey<HTMLDivElement>(
    ({ key }) => setPress(key),
    () => 'leaved'
  )

  return (
    <div>
      <div>
        <p>downQueue: {downQueue.join(',')}</p>
        <p>upQueue: {upQueue.join(',')}</p>
        <p>downAllQueue: {downAllQueue.join(',')}</p>
      </div>
      <div ref={ref} style={{ border: 'solid 1px' }}>
        ref area
        <p>{press}</p>
      </div>
    </div>
  )
}

export default KeyDemo
