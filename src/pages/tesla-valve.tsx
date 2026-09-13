import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// Canvas と ImageData を直接触るので SSR しない
const TeslaValve = dynamic(() => import('../components/TeslaValve'), {
  ssr: false,
})

const title = 'テスラ弁 (Valvular Conduit)'

const TeslaValvePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <TeslaValve />
    </Layout>
  )
}

export default TeslaValvePage
