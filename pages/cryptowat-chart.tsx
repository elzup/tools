import dynamic from 'next/dynamic'
import * as React from 'react'
import { Plot } from '../components/Graph'
import Layout from '../components/Layout'

const Graph = dynamic(() => import('../components/Graph'), { ssr: false })

const title = 'Cryptowat Chart'

const useCryptowat = () => {
  const [plots, setPlots] = React.useState<Plot[]>([])

  React.useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/all')

    socket.onmessage = ({ data }: { data: string }) => {
      const rows: number[][] = JSON.parse(data)
      const plots: Plot[] = rows.map(
        (row): Plot => ({ time: new Date(row[0] * 1000), v: row[4] })
      )

      setPlots(plots)
    }
    return () => socket.close()
  }, [])

  return plots
}

const Chart = () => {
  const plots = useCryptowat()

  return (
    <Layout title={title}>
      <p>{title}</p>
      <Graph plots={plots}></Graph>
    </Layout>
  )
}

export default Chart
