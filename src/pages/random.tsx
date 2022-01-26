import { randGen } from '@elzup/kit/lib/rand'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'random inspect'

const randBasic = Math.random
const makeRand = () => {
  const r = randGen()

  return () => (r.next() % 1000000) / 1000000
}
const randOrigin = makeRand()
const funcs = [randBasic, randOrigin]

const RandInspect = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      {funcs.map((func, i) => (
        <div key={i}></div>
      ))}
    </Layout>
  )
}

export default RandInspect
