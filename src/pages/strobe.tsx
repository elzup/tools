import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const StrobeWheel = dynamic(() => import('../components/StrobeWheel'), {
  ssr: false,
})

const title = 'ストロボ効果 (回転が止まって見える)'

const StrobePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <StrobeWheel />
    </Layout>
  )
}

export default StrobePage
