import { makeRand } from '@elzup/kit/lib/rand/make'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import dynamic from 'next/dynamic'

const title = 'random inspect'

const randBasic = Math.random
const gen = () => {
  const r = makeRand(String(Date.now())).fn

  return () => {
    const tn = r()

    return ((tn ?? 0) % 1000000) / 1000000
  }
}
const randOrigin = gen()
const funcs = [randBasic, randOrigin]

const RandInspect = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      {funcs.map((func, i) => (
        <div key={i}>{func()}</div>
      ))}
    </Layout>
  )
}

export default RandInspect
