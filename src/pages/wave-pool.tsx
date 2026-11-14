import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// Canvas と ImageData を直接触るので SSR しない
const WavePool = dynamic(() => import('../components/WavePool'), {
  ssr: false,
})

const title = '円形プールの波形成形'

const WavePoolPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <WavePool />
    </Layout>
  )
}

export default WavePoolPage
