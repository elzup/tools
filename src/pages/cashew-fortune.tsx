import CashewFortune from '../components/CashewFortune'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'パカッと割れる占いシミュレーター'

const CashewFortunePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <CashewFortune />
    </Layout>
  )
}

export default CashewFortunePage
