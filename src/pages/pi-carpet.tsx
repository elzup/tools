import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// 盤面を乱数で作るため SSR と初期描画が一致しない
const PiCarpet = dynamic(() => import('../components/PiCarpet'), { ssr: false })

const title = '円周率カーペット'

const PiCarpetPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <PiCarpet />
    </Layout>
  )
}

export default PiCarpetPage
