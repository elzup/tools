import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const SeatbeltReel = dynamic(() => import('../components/SeatbeltReel'), {
  ssr: false,
})

const title = 'シートベルト慣性ロック'

const SeatbeltPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SeatbeltReel />
    </Layout>
  )
}

export default SeatbeltPage
