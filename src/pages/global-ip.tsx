import * as React from 'react'
import { Button, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const API_URL = 'https://api.ipify.org/?format=json'

type IpData = { ip: string }

function usePublicIp() {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [result, setResult] = React.useState<string | null>(null)

  const getIp = async () => {
    setLoading(true)
    const res = await fetch(API_URL)
    const data = (await res.json()) as IpData

    setResult(data.ip)
    setLoading(false)
  }

  return [loading, result, getIp] as const
}

const title = 'public IP取得'
const GlobalIp = () => {
  const [loading, ip, getIp] = usePublicIp()

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <Header as="h3">get global ip on CSR application</Header>
      <p>
        <code>{API_URL}</code>
      </p>
      <p>
        loading: <code>{loading ? 'true' : 'none'}</code>
      </p>
      <Button onClick={getIp}>IP取得実行</Button>
      <div>
        IP: <code>{ip}</code>
      </div>
    </Layout>
  )
}

export default GlobalIp
