import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const EllipBilliards = dynamic(() => import('../components/EllipBilliards'), {
  ssr: false,
})

const title = '楕円ビリヤード'

const EllipBilliardsPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <EllipBilliards />
    </Layout>
  )
}

export default EllipBilliardsPage
