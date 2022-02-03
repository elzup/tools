import React, { useEffect, useState } from 'react'

const useAccelerometer = () => {
  const [acc, setAcc] = useState<Partial<{ x: number; y: number; z: number }>>(
    {}
  )

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const acl = new Accelerometer({ frequency: 60 })

    acl.addEventListener('reading', () => {
      setAcc({ x: acl.x, y: acl.y, z: acl.z })
    })
    acl.start()
  })

  return { acc }
}

function Page() {
  const { acc } = useAccelerometer()

  return <div>{JSON.stringify(acc)}</div>
}
export default Page
