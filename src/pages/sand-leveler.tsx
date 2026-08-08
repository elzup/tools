import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const SandLeveler = dynamic(() => import('../components/SandLeveler'), {
  ssr: false,
})

const title = '砂ならしプロペラ'

const SandLevelerPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <SandLeveler />
    </Layout>
  )
}

export default SandLevelerPage
