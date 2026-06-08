import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const Domino3D = dynamic(() => import('../components/Domino3D'), {
  ssr: false,
})

const title = 'ドミノ倒し'

const Domino3DPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Domino3D />
    </Layout>
  )
}

export default Domino3DPage
