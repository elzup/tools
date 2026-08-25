import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'キャベンディッシュ実験'

const CavendishExperiment = dynamic(
  () => import('../components/CavendishExperiment'),
  { ssr: false }
)

const CavendishExperimentPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <CavendishExperiment />
    </Layout>
  )
}

export default CavendishExperimentPage
