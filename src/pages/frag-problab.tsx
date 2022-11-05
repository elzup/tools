import { Alert, Button } from '@mui/material'
import Link from 'next/link'
import * as React from 'react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

type Frog = 'm' | 'f'

// male は鳴く
// female は助かる
const sampleFrog = (): Frog => (Math.random() > 0.5 ? 'm' : 'f')

type Sample = [[Frog, Frog], [Frog]]

// 2匹の方からオスの鳴き声が聞こえる 少なくとも1匹はオス
const okSample = ([[a, b], _c]: Sample) => a === 'm' || b === 'm'

const sample = (): Sample => {
  return [[sampleFrog(), sampleFrog()], [sampleFrog()]]
}
const genOkSample = () => {
  while (true) {
    const s = sample()

    if (okSample(s)) return s
  }
}
const MANY = 10000

type Case = { sample: Sample; f2: boolean; f1: boolean }

function useSample() {
  const [list, setList] = React.useState<Case[]>([])
  const [count, setCounts] = React.useState<{
    n: number
    f1: number
    f2: number
  }>({
    n: 0,
    f1: 0,
    f2: 0,
  })

  function drawMany(n = MANY) {
    for (let i = 0; i < n; i++) {
      drawOne()
    }
  }
  function drawOne() {
    const sample = genOkSample()
    const f2 = sample[0].includes('f')
    const f1 = sample[1].includes('f')

    setList((v) => [{ sample, f1, f2 }, ...v].slice(0, 20))
    setCounts((v) => ({
      n: v.n + 1,
      f2: v.f2 + (f2 ? 1 : 0),
      f1: v.f1 + (f1 ? 1 : 0),
    }))
  }

  return {
    drawMany,
    drawOne,
    list,
    count,
  }
}

const title = 'Frog Prob LAB'

const FragProbLab = () => {
  const { list, drawOne, drawMany, count } = useSample()

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <p>
        <Link href="https://www.youtube.com/watch?v=cpwSGsb-rTs&t=13s">
          この動画の検証
        </Link>
      </p>
      <Button onClick={drawOne}>1回シミュレーションする</Button>
      <Button onClick={() => drawMany()}>{MANY}回シミュレーションする</Button>
      <p>
        F2: {count.f2}/{count.n} ({(count.f2 / count.n) * 100}%)
      </p>
      <p>
        F1: {count.f1}/{count.n} ({(count.f1 / count.n) * 100}%)
      </p>
      <div>
        <ul>
          {list.map((c, i) => (
            <li key={i}>{JSON.stringify(c.sample)}</li>
          ))}
        </ul>
      </div>
      <Alert>
        <p>male は鳴く</p>
        <p>female は助かる</p>
        <p>2匹の方は少なくとも1匹オスのケースのみ採用</p>
      </Alert>
    </Layout>
  )
}

export default FragProbLab
