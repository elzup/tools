import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const InvertedDoublePendulum = dynamic(
  () => import('../components/InvertedDoublePendulum'),
  { ssr: false }
)

const title = '倒立二重振り子カート'

const InvertedDoublePendulumPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <InvertedDoublePendulum />
    </Layout>
  )
}

export default InvertedDoublePendulumPage
