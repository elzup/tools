import * as React from 'react'
import { Button, Form, Header, Input } from 'semantic-ui-react'
import Layout from '../components/Layout'

const title = 'モンテカルロ PI ラボ'
const PiLab = () => {
  const { total, inCount, pi, countStop, start } = useMonteCarlo()
  const [upNum, setUpnum] = React.useState<number>(0)

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <p>Total: {total}</p>
      <p>inCount: {inCount}</p>
      <p>PI: {pi}</p>

      <Form.Field>
        <Input
          style={{ width: '100%' }}
          size="large"
          type="number"
          // TODO
          inputProps={{
            min: '0',
            max: '100000',
            defaultValue: '1',
          }}
          onChange={(e) => setUpnum(Number(e.target.value))}
        />
        <Button onClick={() => start(upNum)}>try</Button>
      </Form.Field>
    </Layout>
  )
}

const stopCount = Number.MAX_SAFE_INTEGER

// pi : 4 = inCount : total
// pi = inCount / total * 4
function useMonteCarlo() {
  const [total, setTotal] = React.useState<number>(0)
  const [inCount, setInCount] = React.useState<number>(0)
  const [countStop, setCountStop] = React.useState<boolean>(false)

  function start(n = 1) {
    const safeN = Math.min(n, stopCount - total)
    let ic = 0

    if (safeN >= stopCount - total) setCountStop(true)

    for (let i = 0; i <= safeN; i++) {
      const x = Math.random()
      const y = Math.random()

      if (x ** 2 + y ** 2 <= 1) {
        ic++
      }
    }

    setTotal((v) => v + safeN)
    setInCount((v) => v + ic)
  }

  return {
    total,
    inCount,
    countStop,
    start,
    pi: (inCount / total) * 4,
  } as const
}

export default PiLab
