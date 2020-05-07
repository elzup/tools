import * as React from 'react'
import { Form, Header, Input, Label } from 'semantic-ui-react'
import { Chart } from 'react-google-charts'
// eslint-disable-next-line import/no-unresolved
import { GoogleDataTableColumn } from 'react-google-charts/dist/types'
import Layout from '../components/Layout'

type ParseResult = {
  actionName: string
  badgeUrl: string
  badgeText: string
} | null

const columns: GoogleDataTableColumn[] = [
  {
    label: 'num',
    type: 'number',
  },
  {
    label: 'label',
    type: 'number',
  },
]

const rows = [
  [2015, 5],
  [2016, 3],
  [2018, 1],
]

const title = '正規分布ツール'
const NormalDistribution = () => {
  const [mu, setMu] = React.useState<number>(2400)
  const [sigma, setSigma] = React.useState<number>(140)

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <Form.Group widths="equal">
        <Form.Input
          label="μ"
          value={sigma}
          style={{ width: '100%' }}
          size="large"
          onChange={({ target: { value } }) => setSigma(Number(value))}
        />
        <Form.Input
          value={mu}
          label="σ"
          style={{ width: '100%' }}
          size="large"
          onChange={({ target: { value } }) => setMu(Number(value))}
        />
      </Form.Group>
      <Chart
        chartType="AreaChart"
        width="100%"
        height="400px"
        legendToggle
        rows={rows}
        columns={columns}
      />
    </Layout>
  )
}

export default NormalDistribution
