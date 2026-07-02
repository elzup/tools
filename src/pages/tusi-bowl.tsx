import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const TusiBowl = dynamic(() => import('../components/TusiBowl'), {
  ssr: false,
})

const title = 'ボウル円運動 (Tusi couple)'

const TusiBowlPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <TusiBowl />
    </Layout>
  )
}

export default TusiBowlPage
