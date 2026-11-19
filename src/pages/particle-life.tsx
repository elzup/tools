import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const ParticleLife = dynamic(() => import('../components/ParticleLife'), {
  ssr: false,
})

const title = 'パーティクルライフ'

const ParticleLifePage = () => {
  return (
    <Layout title={title} fullWidth>
      <Title>{title}</Title>
      <ParticleLife />
    </Layout>
  )
}

export default ParticleLifePage
