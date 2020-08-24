import * as React from 'react'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Plot } from '../components/Graph'

const Graph = dynamic(() => import('../components/Graph'), { ssr: false })

const title = 'Cryptowat Chart'

const loadCryptowat = (after: number, periods: number) => {
  const params = { after: String(after), periods: String(periods) }
  const qs = new URLSearchParams(params)
  const url = `https://api.cryptowat.ch/markets/bitflyer/btcfxjpy/ohlc?${qs}`

  return fetch(url).then((response) => response.json())
}

const useCryptowat = () => {
  const [plots, setPlots] = React.useState<Plot[]>([])

  React.useEffect(() => {}, [])

  return plots
}

const Chart = () => {
  // n / 2
  // n * 3 + 1 = k
  // n = (k - 1) / 3
  // 1
  // (v - 1) / 3
  // v * 2

  return (
    <Layout title={title}>
      <p>{title}</p>
      <Graph plots={plots}></Graph>
    </Layout>
  )
}

export default Chart
