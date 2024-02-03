import dynamic from 'next/dynamic'
import * as React from 'react'
import { range } from '@elzup/kit'
import Layout from '../components/Layout'

const Graph = dynamic(() => import('../components/GraphSnake'), { ssr: false })

const title = 'D3 play'

const primes = (n: number) => {
  const primes: number[] = []

  for (let i = 2; i < n; i++) {
    if (primes.every((v) => i % v !== 0)) {
      primes.push(i)
    }
  }

  return primes
}

const primeNmCheck = (p: number) => {
  for (let n = 0; n < p; n++) {
    if (2 ** n > p) break
    for (let m = 0; m < p; m++) {
      const t = 2 ** n + 3 ** m

      if (t > p) break
      if (t === p) return { n, m, hit: true, p }
    }
  }
  return { n: 0, m: 0, hit: false, p }
}

const nms = primes(1000).map(primeNmCheck)

const Chart = () => {
  return (
    <Layout title={title}>
      {nms.map(({ n, m, hit, p }, i) => (
        <div key={p} data-hit={hit}>
          {p}{' '}
          {hit && (
            <span>
              (2<sup>{n}</sup> + 3<sup>{m}</sup>)
            </span>
          )}
        </div>
      ))}
    </Layout>
  )
}

export default Chart
