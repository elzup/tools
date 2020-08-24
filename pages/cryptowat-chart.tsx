import dynamic from 'next/dynamic'
import * as React from 'react'
import { DataSet } from '../components/Graph'
import Layout from '../components/Layout'

const Graph = dynamic(() => import('../components/Graph'), { ssr: false })

const title = 'Cryptowat Chart'

const useCryptowat = () => {
  const [datasets, setDatasets] = React.useState<DataSet | null>(null)

  React.useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/all')

    socket.onmessage = ({ data }: { data: string }) => {
      const res = JSON.parse(data) as DataSet

      setDatasets(res)
    }
    return () => socket.close()
  }, [])

  return datasets
}

const Chart = () => {
  const datasets = useCryptowat()

  return (
    <Layout title={title}>
      <p>{title}</p>
      {datasets && <Graph datasets={datasets}></Graph>}
    </Layout>
  )
}

export default Chart
