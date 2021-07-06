import * as React from 'react'
import { Button, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const API_URL = 'https://api.ipify.org/?format=json'

type IpData = { ip: string }

const title = 'public IP取得'
const GlobalIp = () => {
  const [status, setStatus] = React.useState<'start' | 'loading' | 'finish'>(
    'start'
  )
  const [result, setResult] = React.useState<string>('')
  const getIp = async () => {
    setStatus('loading')
    const res = await fetch(API_URL)
    const data = (await res.json()) as IpData

    setResult(data.ip)
    setStatus('finish')
  }

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <Header as="h3">get global ip on CSR application</Header>
      <p>
        <code>{API_URL}</code>
      </p>
      <p>
        status: <code>{status}</code>
      </p>
      <Button onClick={getIp}>IP取得実行</Button>
      <div>
        IP: <code>{result}</code>
      </div>
    </Layout>
  )
}

export default GlobalIp
