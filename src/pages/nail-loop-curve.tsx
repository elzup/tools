import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const NailLoopCurve = dynamic(() => import('../components/NailLoopCurve'), {
  ssr: false,
})

const title = '3本の釘と糸の輪'

const NailLoopCurvePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <NailLoopCurve />
    </Layout>
  )
}

export default NailLoopCurvePage
