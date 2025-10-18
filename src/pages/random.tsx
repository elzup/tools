import { makeRand } from '@elzup/kit/lib/rand/make'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'random inspect'

const gen = () => {
  const r = makeRand(String(Date.now())).fn

  return () => {
    const tn = r()

    return ((tn ?? 0) % 1000000) / 1000000
  }
}

const randBasic = Math.random
const randOrigin = gen()
const funcs = [randBasic, randOrigin]

const RandInspectContent = () => {
  const randoms = funcs.map((func) => func())

  return (
    <>
      {randoms.map((value) => (
        <div key={value}>{value}</div>
      ))}
    </>
  )
}

const RandInspectDynamic = dynamic(() => Promise.resolve(RandInspectContent), {
  ssr: false,
})

const RandInspect = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <RandInspectDynamic />
    </Layout>
  )
}

export default RandInspect
