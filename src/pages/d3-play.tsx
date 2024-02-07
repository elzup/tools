import { keyBy } from '@elzup/kit/lib/keyBy'
import { range } from 'lodash'
import styled from 'styled-components'
import Layout from '../components/Layout'

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

const n2m3Check = (p: number) => {
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
const isPowerOf2 = (n: number) => (n & (n - 1)) === 0
const isPowerOf3 = (n: number) => {
  if (n < 1) {
    return false
  }
  while (n % 3 === 0) {
    // eslint-disable-next-line no-param-reassign
    n /= 3
  }
  return n === 1
}

const isPrime = keyBy(primes(2500).map(String), (v) => v)

const nms = primes(1000).map(n2m3Check)

const Chart = () => {
  return (
    <Layout title={title}>
      <Style>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(50, 1fr)' }}
        >
          {range(2500)
            .map((v) => v + 1)
            .map((i) => {
              return (
                <div
                  key={i}
                  className="cell"
                  data-prime={Boolean(isPrime[i])}
                  data-n2={Boolean(isPowerOf2(i))}
                  data-n3={isPowerOf3(i)}
                  data-n2m3={n2m3Check(i).hit}
                >
                  {i}
                </div>
              )
            })}
        </div>
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
      </Style>
    </Layout>
  )
}

const Style = styled.div`
  .cell {
    font-size: 0.5rem;

    &[data-prime='true'] {
      border: solid 1px red;
    }
    &[data-n2='true'] {
      background: yellow;
    }
    &[data-n3='true'] {
      background: aqua;
    }
    &[data-n2m3='true'] {
      background: lime;
    }
  }
`

export default Chart
